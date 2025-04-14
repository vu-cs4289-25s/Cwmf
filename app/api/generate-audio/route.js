// app/api/generate-audio/route.js
import { NextResponse } from 'next/server';
import audioCache, { generateCacheKey } from '../../utils/audioCache';

export async function POST(request) {
    try {
        const { text, voice, speed, quality, emotion } = await request.json();

        if (!text) {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        // Get API credentials from environment variables
        const apiKey = process.env.PLAYHT_API_KEY;
        const userId = process.env.PLAYHT_USER_ID;

        if (!apiKey || !userId) {
            return NextResponse.json(
                { error: 'PlayHT credentials not configured' },
                { status: 500 }
            );
        }

        // Use the provided voice ID or fallback to a default
        const voiceId = voice || process.env.PLAYHT_DEFAULT_VOICE_ID;

        // Add exclamation marks to make the voice more excited if not already present
        let excitedText = text;
        if (!excitedText.endsWith('!') && !excitedText.endsWith('?') && !excitedText.endsWith('.')) {
            excitedText += '!';
        }

        // Create a more excited cache key that includes emotion params
        const cacheKey = generateCacheKey(excitedText, voiceId + '_excited');
        const cachedAudioUrl = audioCache.get(cacheKey);

        if (cachedAudioUrl) {
            console.log('Using cached audio for:', excitedText.substring(0, 30) + '...');
            return NextResponse.json({ audioUrl: cachedAudioUrl });
        }

        console.log('Generating excited audio for text:', excitedText);
        console.log('Using voice ID:', voiceId);

        // Create the request body with correct parameters
        // Using only parameters that are accepted by the API
        const requestBody = {
            text: excitedText,
            voice: voiceId,
            quality: quality || 'medium',
            output_format: 'mp3',
            speed: parseFloat(speed), // Slightly faster for excitement
            sample_rate: 24000,
            voice_engine: "PlayHT2.0", // Use the correct format without -turbo
        };

        // Only add the emotion parameter if it's provided and supported
        if (emotion) {
            console.log('Using emotion:', emotion);
        }

        console.log('Request body:', JSON.stringify(requestBody));

        // Use the v2 TTS API with the correct format and excitement parameters
        const playhtResponse = await fetch('https://api.play.ht/api/v2/tts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'X-User-ID': userId,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
        });

        if (!playhtResponse.ok) {
            let errorMessage = 'Failed to generate audio';
            try {
                const errorData = await playhtResponse.text();
                console.error('PlayHT API error:', errorData);
                errorMessage = `PlayHT API error: ${errorData}`;
            } catch (parseError) {
                console.error('PlayHT API error (could not parse):', playhtResponse.statusText);
                errorMessage = `PlayHT API error: ${playhtResponse.statusText}`;
            }

            return NextResponse.json(
                { error: errorMessage },
                { status: playhtResponse.status }
            );
        }

        // Get the response text
        const responseText = await playhtResponse.text();
        console.log('Raw response first 200 chars:', responseText.substring(0, 200));

        // Try to parse the response
        let responseData;
        try {
            // Check if it's SSE or JSON
            if (responseText.includes('event:')) {
                // It's an SSE response, we need to extract the last completed event
                const events = responseText.split('\n\n');
                let lastCompleteEvent = null;

                // Find the "complete" event which contains the URL
                for (const event of events) {
                    if (event.includes('stage": "complete"') || event.includes('stage":"complete"')) {
                        // This looks like a complete event
                        const dataLine = event.split('\n').find(line => line.startsWith('data:'));
                        if (dataLine) {
                            lastCompleteEvent = dataLine.substring(5); // Remove 'data:' prefix
                        }
                    }
                }

                if (lastCompleteEvent) {
                    responseData = JSON.parse(lastCompleteEvent);
                } else {
                    throw new Error('No complete event found in SSE response');
                }
            } else {
                // It's a regular JSON response
                responseData = JSON.parse(responseText);
            }

            console.log('Parsed response data:', responseData);
        } catch (error) {
            console.error('Error parsing response:', error);

            // Try to extract URL using regex as a last resort
            const urlMatch = responseText.match(/(https:\/\/[^"\s]+\.mp3)/);
            if (urlMatch) {
                const audioUrl = urlMatch[0];
                console.log('Extracted URL using regex:', audioUrl);
                audioCache.set(cacheKey, audioUrl);
                return NextResponse.json({ audioUrl });
            }

            return NextResponse.json(
                { error: 'Failed to parse response: ' + error.message },
                { status: 500 }
            );
        }

        // Based on your sample response, extract the URL
        if (responseData && responseData.output && responseData.output.url) {
            console.log('Found audio URL in output.url:', responseData.output.url);
            audioCache.set(cacheKey, responseData.output.url);
            return NextResponse.json({ audioUrl: responseData.output.url });
        } else if (responseData.url) {
            console.log('Found audio URL in url field:', responseData.url);
            audioCache.set(cacheKey, responseData.url);
            return NextResponse.json({ audioUrl: responseData.url });
        } else if (responseData.id) {
            // If we only have an ID, we need to poll for the result
            try {
                const audioUrl = await pollForAudioUrl(responseData.id, apiKey, userId);
                console.log('Got audio URL from polling:', audioUrl);
                audioCache.set(cacheKey, audioUrl);
                return NextResponse.json({ audioUrl });
            } catch (pollError) {
                console.error('Error polling for audio URL:', pollError);
                return NextResponse.json(
                    { error: 'Failed to get audio URL: ' + pollError.message },
                    { status: 500 }
                );
            }
        } else {
            console.error('No URL found in response:', responseData);
            return NextResponse.json(
                { error: 'No URL found in response' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error generating audio:', error);
        return NextResponse.json(
            { error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}

// Function to poll for the audio URL if needed
async function pollForAudioUrl(jobId, apiKey, userId, maxAttempts = 10) {
    console.log('Polling for audio URL, jobId:', jobId);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            console.log(`Polling attempt ${attempt + 1}/${maxAttempts}`);

            const response = await fetch(`https://api.play.ht/api/v2/tts/${jobId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'X-User-ID': userId,
                },
            });

            if (!response.ok) {
                console.error(`Failed to check job status: ${response.statusText}`);
                throw new Error(`Failed to check job status: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Job status:', data);

            // Check if the job is complete and has output with a URL
            if (data.status === 'complete' || data.stage === 'complete') {
                if (data.output && data.output.url) {
                    console.log('Job complete, returning URL:', data.output.url);
                    return data.output.url;
                } else if (data.url) {
                    console.log('Job complete, returning URL:', data.url);
                    return data.url;
                }
            }

            // Check for FAILED status
            if (data.status === 'FAILED' || data.stage === 'failed') {
                throw new Error('Audio generation failed');
            }

            // Wait before polling again, with progressively longer waits but not too long
            const delay = Math.min(1000 * (attempt + 1), 3000);
            console.log(`Waiting ${delay}ms before next poll`);
            await new Promise(resolve => setTimeout(resolve, delay));
        } catch (error) {
            console.error(`Polling attempt ${attempt + 1} failed:`, error);
            if (attempt === maxAttempts - 1) {
                throw error;
            }
        }
    }

    throw new Error('Max polling attempts reached');
}
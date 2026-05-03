async function testRateLimit() {
    console.log("Starting 25 rapid requests to test rate limiter...");
    console.log("Target limit: 20 requests per 15 minutes\n");
    
    for (let i = 1; i <= 25; i++) {
        try {
            const res = await fetch("http://localhost:5000/api/v1/test-rate-limit");
            const json = await res.json();
            
            if (res.status === 429) {
                console.log(`❌ Request ${i} BLOCK: Rate Limited! -> "${json.message}"`);
            } else {
                console.log(`✅ Request ${i} PASS: Success`);
            }
        } catch (e) {
            console.error(`Request ${i} failed: ${e.message}`);
        }
        
        // Slight delay to make logs readable
        await new Promise(resolve => setTimeout(resolve, 50));
    }
}

testRateLimit();

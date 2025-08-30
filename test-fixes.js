const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test 1: Path Traversal Fix
async function testPathTraversal() {
    console.log('\n=== Testing Path Traversal Fix ===');
    
    // These should be blocked
    const maliciousTests = [
        '../../../etc/passwd',
        '../../app.js',
        '../secret.txt',
        'valid.txt/../../etc/passwd'
    ];
    
    for (const filename of maliciousTests) {
        try {
            const response = await axios.get(`${BASE_URL}/file?name=${filename}`);
            console.log(`❌ FAIL: ${filename} was not blocked!`);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log(`✅ PASS: ${filename} was blocked (400 Bad Request)`);
            } else {
                console.log(`❌ FAIL: ${filename} - unexpected error`);
            }
        }
    }
    
    // Valid filename should work
    console.log('Testing valid filename: report.pdf');
    // Note: This would succeed if uploads/report.pdf exists
}

// Test 2: Race Condition Fix
async function testRaceCondition() {
    console.log('\n=== Testing Race Condition Fix ===');
    
    // Send 10 concurrent requests
    const promises = [];
    for (let i = 0; i < 10; i++) {
        promises.push(axios.post(`${BASE_URL}/increment`));
    }
    
    const results = await Promise.all(promises);
    const counters = results.map(r => r.data.counter);
    
    console.log('Counter values received:', counters);
    
    // Check if all values are unique (no race condition)
    const uniqueValues = new Set(counters);
    if (uniqueValues.size === 10) {
        console.log('✅ PASS: All counter values are unique (1-10)');
        console.log('Final counter should be 10:', Math.max(...counters));
    } else {
        console.log('❌ FAIL: Duplicate counter values found (race condition exists)');
    }
}

// Test 3: Performance Fix
async function testPerformance() {
    console.log('\n=== Testing Performance Fix ===');
    
    console.log('Testing duplicate detection performance...');
    const startTime = Date.now();
    
    try {
        const response = await axios.get(`${BASE_URL}/duplicates`);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`Response time: ${duration}ms`);
        console.log(`Number of duplicates found: ${response.data.duplicates.length}`);
        
        if (duration < 100) {
            console.log('✅ PASS: Excellent performance (< 100ms)');
        } else if (duration < 500) {
            console.log('✅ PASS: Good performance (< 500ms)');
        } else if (duration < 1000) {
            console.log('⚠️  WARNING: Acceptable performance (< 1s)');
        } else {
            console.log('❌ FAIL: Poor performance (> 1s)');
        }
    } catch (error) {
        console.log('❌ FAIL: Error calling duplicates endpoint');
    }
}

// Run all tests
async function runTests() {
    console.log('Starting tests... Make sure the server is running on port 3000');
    
    try {
        await testPathTraversal();
        await testRaceCondition();
        await testPerformance();
        
        console.log('\n=== All Tests Completed ===');
    } catch (error) {
        console.error('Error running tests:', error.message);
        console.log('Make sure the server is running: npm start');
    }
}

// Only run if executed directly
if (require.main === module) {
    runTests();
}
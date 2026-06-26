export async function fetchWithRetry(url, retries = 3, delay = 2000) {
    for (let attempt = 0; attempt < retries; attempt++) {
        const response = await fetch(url)
        
        if (response.ok) return response

        if (response.status === 503 && attempt < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
        }

        throw new Error(`Request failed with status ${response.status}`)
    }
}
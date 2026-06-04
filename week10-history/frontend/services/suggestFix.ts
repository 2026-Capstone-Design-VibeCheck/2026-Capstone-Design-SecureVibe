import api from './api'

export const suggestFix = (
    vulnerableCode: string,
    cwe: string,
    message: string,
    apiKey: string,
) => {
    const formData = new FormData()
    formData.append("vulnerable_code", vulnerableCode)
    formData.append("cwe", cwe)
    formData.append("message", message)
    formData.append("api_key", apiKey)
    return api.post('/suggest-fix', formData)
}

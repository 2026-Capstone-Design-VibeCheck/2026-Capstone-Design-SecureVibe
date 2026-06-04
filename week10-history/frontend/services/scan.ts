import api from './api'

export const scanFile = (formData: FormData) => {
    return api.post('/scan', formData)
}

export const scanUrl = (url: string) => {
    const formData = new FormData()
    formData.append("codeurl", url)
    return api.post('/scan', formData)
}

export const scanText = (code: string, language: string) => {
    const formData = new FormData()
    formData.append("code_text", code)
    formData.append("language", language)
    return api.post('/scan', formData)
}

export const analyzeResults = async (results: unknown[], formData: FormData, apiKey: string) => {
    const codeFile = formData.get('code_file');
    let codetext = "";

    if (codeFile instanceof File) {
        // File 객체일 경우 내부의 텍스트 콘텐츠를 직접 읽어옵니다.
        codetext = await codeFile.text();
    } else {
        codetext = codeFile as string;
    }
    return api.post('/analyze', {raw_results: results, target_code: codetext, api_key: apiKey})
}

export const saveHistory = (mod: number, aimod: number, normalresults: unknown[], results: unknown[], formData: FormData, timestamp: string, id: string) => {
    const codeFile = formData.get('code_file');
    let codetext = "";
    let filename = "unknown file";
    if(id==="guest"){
        return; // 게스트는 히스토리를 저장하지 않습니다.
    }

    if (codeFile instanceof File) {
        // File 객체일 경우 내부의 텍스트 콘텐츠를 직접 읽어옵니다.
        filename = codeFile.name;
        codeFile.text().then(text => {
            codetext = text;
            api.post('/save', {mode: mod, aimod: aimod, normal_results: normalresults, raw_results: results, filename: filename, timestamp: timestamp, user_id: id})
        });
    } else {
        codetext = codeFile as string;
        return api.post('/save', {mode: mod, aimod: aimod, normal_results: normalresults, raw_results: results, filename: filename, timestamp: timestamp, user_id: id})
    }
}

export const analyzetext = async (results: unknown[], code: string, apiKey: string) => {
return api.post('/analyze', {raw_results: results, target_code: code, api_key: apiKey})
}
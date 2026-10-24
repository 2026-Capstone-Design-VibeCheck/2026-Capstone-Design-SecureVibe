from __future__ import annotations
import json,re,shutil,tempfile
from pathlib import Path
from urllib.parse import urlparse,urlsplit,urlencode
import requests
from fastapi import FastAPI,File,Form,HTTPException,UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from .bola_idor_detector import OpenAPIResourceIDDetector,load_openapi_file
from .explain import build_report
from .links2cpn_two_stage_detector import attach_dynamic_evidence,run_links2cpn
BASE_DIR=Path(__file__).resolve().parent.parent
app=FastAPI(title='Explainable IDOR Analyzer')
app.mount('/static',StaticFiles(directory=BASE_DIR/'static'),name='static')
HTTP_METHODS={'get','post','put','patch','delete','options','head'}
SAFE_METHODS={'get','head','options'}
FALLBACK='00000000-0000-4000-8000-000000000001'

def validate_url(v:str):
    p=urlparse(v)
    if p.scheme not in {'http','https'} or not p.netloc: raise HTTPException(400,'유효한 http/https URL이 아닙니다.')

def save_upload(u:UploadFile,d:Path):
    d.parent.mkdir(parents=True,exist_ok=True)
    with d.open('wb') as f: shutil.copyfileobj(u.file,f)

def redact(v:str)->str:
    return 'Bearer <redacted>' if v else ''

def schema_value(name,schema,examples,actor):
    if name in examples: return str(examples[name])
    s=schema or {}; n=name.lower()
    if s.get('example') is not None:return str(s['example'])
    if s.get('default') is not None:return str(s['default'])
    if s.get('enum'):return str(s['enum'][0])
    if 'user' in n or 'owner' in n:return 'user2'
    if 'product' in n:return 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    if any(x in n for x in ('uuid','guid')):return FALLBACK
    if 'token' in n:return 'test'
    if 'email' in n:return 'user2@example.com'
    if 'name' in n:return 'Laptop'
    if n in {'q','query'}:return 'test'
    if 'role' in n:return 'user'
    if any(x in n for x in ('id','key','number')):return '2'
    if s.get('type')=='integer':return '2'
    return actor

def parameters_for(path_item,operation):
    out=[]
    for p in (path_item.get('parameters',[]) if isinstance(path_item,dict) else []) + (operation.get('parameters',[]) or []):
        if isinstance(p,dict) and p.get('name') and p.get('in') in {'path','query','header','cookie'}:out.append(p)
    return out

def make_request(path_template,path_item,operation,examples,actor):
    params=parameters_for(path_item,operation); vals={}
    for p in params: vals[(p['in'],p['name'])]=schema_value(p['name'],p.get('schema'),examples,actor)
    path=re.sub(r'\{([^{}]+)\}',lambda m:str(vals.get(('path',m.group(1)),FALLBACK)),path_template)
    query={p['name']:v for (loc,n),v in vals.items() if loc=='query' and (p:=next((x for x in params if x['name']==n and x['in']==loc),None))}
    headers={p['name']:v for p in params if p['in']=='header' for v in [vals.get(('header',p['name']))] if v}
    return path,query,headers

def normalize(src:Path,dst:Path):
    n=0
    with src.open(encoding='utf-8-sig') as a,dst.open('w',encoding='utf-8') as b:
        for line in a:
            if not line.strip():continue
            e=json.loads(line);e.setdefault('requestBody',{});b.write(json.dumps(e,ensure_ascii=False,separators=(',',':'))+'\n');n+=1
    return n

def dynamic_status(code,body):
    if code==401:return 'authentication-failed'
    if code==403:return 'protected'
    if code==422:return 'request-invalid'
    if code==405:return 'method-not-allowed'
    if code==404:return 'not-found-or-hidden'
    if 200<=code<300:
        return 'success-empty-response' if body in ({},[],None,'') else 'candidate-success-with-data'
    return 'request-failed'

def auto_events(spec,base,out,token,actor,examples,mutating=False):
    headers={'Authorization':f'Bearer {token}'} if token else {};events=[];skipped=[]
    for path,item in spec.get('paths',{}).items():
        if not isinstance(item,dict):continue
        for method,op in item.items():
            ml=method.lower()
            if ml not in HTTP_METHODS or not isinstance(op,dict):continue
            if not mutating and ml not in SAFE_METHODS:skipped.append({'method':method.upper(),'path':path});continue
            actual,query,param_headers=make_request(path,item,op,examples,actor)
            req_headers={**headers,**param_headers};url=base.rstrip('/')+'/'+actual.lstrip('/')
            body={}
            try:
                r=requests.request(method.upper(),url,headers=req_headers,params=query,json=body if ml in {'post','put','patch'} else None,timeout=15)
                try: rb=r.json()
                except Exception: rb=r.text[:5000]
                code=r.status_code;err=None
            except requests.RequestException as ex: rb={'error':str(ex)};code=0;err=str(ex)
            uri=urlsplit(url).path+ (('?'+urlencode(query)) if query else '')
            # Links2CPN reads structured fields for matching, but its replay
            # diagnostics and original log format also expect `message`.
            # Keep the concrete URI for HTTP evidence and add a canonical
            # human-readable line for the CPN adapter.
            message=f"{method.upper()} {uri} {code} 0ms"
            events.append({'method':method.upper(),'uri':uri,'message':message,'statusCode':code,'status_code':code,'ip':actor,'headerAuthorization':redact(headers.get('Authorization','')),'requestBody':body,'queryParams':query,'openapiPath':path,'operationId':op.get('operationId'),'responseBody':rb,'response_body':rb,'dynamic_status':dynamic_status(code,rb),'cpn_status':'not-present-in-model',**({'error':err} if err else {})})
    with out.open('w',encoding='utf-8') as f:
        for e in events:f.write(json.dumps(e,ensure_ascii=False,separators=(',',':'))+'\n')
    return {'total_events':len(events),'skipped':skipped,'events':events}

def apply_security(spec):
    if not spec.get('security'):return
    for item in spec.get('paths',{}).values():
        if isinstance(item,dict):
            for m,o in item.items():
                if m.lower() in HTTP_METHODS and isinstance(o,dict):o.setdefault('security',spec['security'])

@app.get('/',response_class=HTMLResponse)
def home():return (BASE_DIR/'static'/'index.html').read_text(encoding='utf-8')

@app.post('/api/analyze')
async def analyze(openapi:UploadFile|None=File(None),openapi_url:str|None=Form(None),source_zip:UploadFile|None=File(None),event_log:UploadFile|None=File(None),github_url:str|None=Form(''),links2cpn_repo:str|None=Form(''),target_base_url:str|None=Form(''),target_token:str|None=Form(''),actor_id:str|None=Form('userA'),parameter_examples:str|None=Form('{}'),include_mutating:bool=Form(False)):
    if openapi is None and not openapi_url:raise HTTPException(400,'OpenAPI 파일 또는 URL이 필요합니다.')
    if openapi_url:validate_url(openapi_url)
    if target_base_url:validate_url(target_base_url)
    try:examples=json.loads(parameter_examples or '{}'); assert isinstance(examples,dict)
    except Exception as e:raise HTTPException(400,f'parameter_examples JSON 오류: {e}')
    work=Path(tempfile.mkdtemp(prefix='idor-'))
    try:
        spec_path=work/'openapi.yaml'
        if openapi:save_upload(openapi,spec_path)
        else:spec_path.write_bytes(requests.get(openapi_url,timeout=20).content)
        spec=load_openapi_file(str(spec_path));apply_security(spec)
        stage1=OpenAPIResourceIDDetector(spec).analyze();log=work/'events.jsonl';generated=None
        if target_base_url:
            generated=auto_events(spec,target_base_url,work/'generated.jsonl',target_token or '',actor_id or 'userA',examples,include_mutating);normalize(work/'generated.jsonl',log)
        elif event_log and event_log.filename:save_upload(event_log,work/'uploaded.jsonl');normalize(work/'uploaded.jsonl',log)
        stage2={'success':False,'status':'not-run','replay_events':[]}
        if links2cpn_repo and log.exists():
            repo=Path(links2cpn_repo.strip()).resolve();py=repo/'.venv'/'Scripts'/'python.exe'
            if py.is_file():stage2=run_links2cpn(repository=str(repo),openapi_file=str(spec_path),event_log=str(log),python_executable=str(py),timeout=300)
            else:stage2={'success':False,'status':'python-not-found','replay_events':[]}
        combined=attach_dynamic_evidence(stage1,stage2);report=build_report(combined)
        report.update({'github_url':github_url or '','openapi_url':openapi_url or '','target_base_url':target_base_url or '','event_log_mode':'generated-from-host' if target_base_url else 'uploaded' if event_log else 'not-provided','automatic_event_log':generated,'stage2':stage2,'parameter_examples':examples})
        return report
    except HTTPException:raise
    except Exception as e:raise HTTPException(500,f'분석 실패: {type(e).__name__}: {e}')
    finally:shutil.rmtree(work,ignore_errors=True)

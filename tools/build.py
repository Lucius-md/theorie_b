#!/usr/bin/env python3
"""Builds supabase/functions/api/content.ts: the protected lesson content (src/app.html + src/questions.js),
served only to users with an active subscription. Run after every content change, then redeploy the Edge Function 'api':
    python3 tools/build.py
"""
import json, re, subprocess, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root/'src/app.html').read_text(encoding='utf8')
q = (root/'src/questions.js').read_text(encoding='utf8')
# turn the questions file into data with node (it is plain JS)
data = subprocess.run(['node','-e',
  "const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');"
  "const f=new Function(s.replace(/\\nconst ALLQ[\\s\\S]*$/,'')+';return {QUESTIONS,QT}');process.stdout.write(JSON.stringify(f()))",
  str(root/'src/questions.js')], capture_output=True, text=True, check=True).stdout
d = json.loads(data)
out = json.dumps({'html': html, 'questions': d['QUESTIONS'], 'qt': d['QT']}, ensure_ascii=False, separators=(',',':'))
(root/'content.json').write_text(out, encoding='utf8')
print('content.json', len(out)//1024, 'KB')

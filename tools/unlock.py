#!/usr/bin/env python3
"""Restore src/app.html and src/questions.js from private.enc (needs ~/.tb_content_key)."""
import os, json, base64, pathlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
root = pathlib.Path(__file__).resolve().parent.parent
key = bytes.fromhex(open(os.path.expanduser('~/.tb_content_key')).read().strip())
raw = base64.b64decode((root/'private.enc').read_text())
d = json.loads(AESGCM(key).decrypt(raw[:12], raw[12:], None))
(root/'src').mkdir(exist_ok=True)
for k, v in d.items(): (root/'src'/k).write_text(v, encoding='utf8')
print('restored', list(d))

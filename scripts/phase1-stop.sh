#!/bin/bash
# 停掉古韵造物或作者演示进程。不改系统服务，不动其它进程。
set -euo pipefail
PORT="${MAITIAN_DEMO_PORT:-8788}"
pids=$(pgrep -f '[s]rc/(demo|guyun)\.mjs' || true)
if [ -n "$pids" ]; then
  kill $pids 2>/dev/null || true
  sleep 0.4
  still=$(pgrep -f '[s]rc/(demo|guyun)\.mjs' || true)
  if [ -n "$still" ]; then kill -9 $still 2>/dev/null || true; fi
fi
if command -v ss >/dev/null; then
  left=$(ss -ltn "sport = :$PORT" 2>/dev/null || true)
  printf '%s\n' "$left"
fi
if pgrep -f '[s]rc/(demo|guyun)\.mjs' >/dev/null; then echo "仍有工作台进程"; exit 1; fi
echo "已停止（端口 $PORT）"

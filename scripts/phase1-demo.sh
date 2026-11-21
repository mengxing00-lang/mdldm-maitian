#!/bin/bash
# 一期无账号演示。只监听 127.0.0.1，数据在隔离目录，不跑安装器、不接账号、不启隧道。
# 启动：scripts/phase1-demo.sh
# 停止：scripts/phase1-stop.sh
# 换目录或端口：MAITIAN_DEMO_DIR=... MAITIAN_DEMO_PORT=8788 scripts/phase1-demo.sh
# 清空重做：scripts/phase1-demo.sh --reset
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
export MAITIAN_DEMO_DIR="${MAITIAN_DEMO_DIR:-/tmp/maitian-phase1-74ad}"
export MAITIAN_DEMO_PORT="${MAITIAN_DEMO_PORT:-8788}"
export MAITIAN_BIND=127.0.0.1
export MAITIAN_DEMO=1
cd "$ROOT"
exec node src/demo.mjs "$@"

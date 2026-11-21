#!/bin/bash
# 古韵造物空工作台。只监听 127.0.0.1，数据在隔离目录。
# 不加载作者示例，不接账号，不采集，不发通知，不开隧道。
# 启动：scripts/phase1-demo.sh
# 带测试夹具（页面会标明，不是默认）：scripts/phase1-demo.sh --fixture
# 停止：scripts/phase1-stop.sh
# 清空：scripts/phase1-demo.sh --reset
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
export MAITIAN_DEMO_DIR="${MAITIAN_DEMO_DIR:-/tmp/guyun-phase1-74ad}"
export MAITIAN_DEMO_PORT="${MAITIAN_DEMO_PORT:-8788}"
export MAITIAN_BIND=127.0.0.1
export MAITIAN_DEMO=1
cd "$ROOT"
exec node src/guyun.mjs "$@"

#!/bin/bash
# One-time login for the Claude seat of the sustainable PDC committee.
#
# The Claude binary shipped with the desktop app cannot inherit that app's
# credentials when it runs as a subprocess, so a scheduled committee run needs
# its own long-lived token. This launcher only starts the official login flow;
# it never handles or stores a credential itself.

cd "$(dirname "$0")" || exit 1

echo "选股神器 · Claude 席位登录"
echo "================================"
echo

# Reuse the tested resolver so this launcher and the committee always agree on
# which binary is current, including after a desktop-app update.
CLAUDE="$(python3 -c "
import sys
sys.path.insert(0, '.')
from stock_pdc.sustainable.roster import CLAUDE_RUNNER
path = CLAUDE_RUNNER.resolve()
print(path if path else '')
" 2>/dev/null)"

if [ -z "$CLAUDE" ]; then
  echo "找不到 claude 命令行程序。"
  echo
  echo "预期位置："
  echo "  ~/Library/Application Support/Claude/claude-code/<版本>/claude.app/Contents/MacOS/claude"
  echo
  echo "请确认 Claude 桌面版已安装并至少启动过一次。"
  echo
  read -r -p "按回车键关闭……"
  exit 1
fi

echo "找到 Claude：$CLAUDE"
echo
echo "接下来会打开浏览器让你授权。你已经登录 Claude 的话，通常点一下确认即可。"
echo

"$CLAUDE" setup-token
STATUS=$?

echo
if [ $STATUS -eq 0 ]; then
  echo "登录完成。正在验证两个席位……"
  echo
  python3 scripts/pdc_sustainable.py doctor
else
  echo "登录未完成（退出码 $STATUS）。"
  echo "把上面的完整输出发给 Claude，可以据此判断下一步。"
fi

echo
read -r -p "按回车键关闭……"

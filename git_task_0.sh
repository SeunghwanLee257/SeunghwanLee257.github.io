#!/bin/bash
set -euo pipefail

branch="refactor/css-architecture"

if git rev-parse --verify "$branch" >/dev/null 2>&1; then
  git checkout "$branch"
else
  git checkout -b "$branch"
fi

echo "브랜치 전환 완료: $(git rev-parse --abbrev-ref HEAD)"
echo "변경 요약:"
git status -sb

#!/bin/bash
# 셈마루 APK 빌드 스크립트 (WSL 또는 Linux 환경)
set -e

echo "================================"
echo "  셈마루 APK 빌드"
echo "================================"

# ANDROID_HOME 확인
if [ -z "$ANDROID_HOME" ]; then
    # 일반적인 위치 자동 탐색
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
    elif [ -d "/usr/local/lib/android/sdk" ]; then
        export ANDROID_HOME="/usr/local/lib/android/sdk"
    else
        echo "ERROR: ANDROID_HOME이 설정되지 않았습니다."
        echo "  export ANDROID_HOME=/path/to/android/sdk"
        exit 1
    fi
fi

echo "ANDROID_HOME: $ANDROID_HOME"
echo ""

# 프로젝트 루트로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# gradlew 실행 권한
if [ -f "./gradlew" ]; then
    chmod +x ./gradlew
else
    echo "ERROR: gradlew 파일이 없습니다. Gradle Wrapper를 생성해주세요."
    echo "  gradle wrapper --gradle-version 8.5"
    exit 1
fi

echo "빌드 시작..."
echo ""

# Debug APK 빌드
./gradlew assembleDebug

echo ""
echo "================================"
echo "  빌드 완료!"
echo "================================"

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "APK 위치: $SCRIPT_DIR/$APK_PATH"
    echo "APK 크기: $APK_SIZE"
else
    echo "WARNING: APK 파일을 찾을 수 없습니다."
    echo "빌드 로그를 확인해주세요."
fi

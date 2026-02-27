#!/bin/bash
# JARVIS Termux 원라이너 설치
# 사용법: curl -sL https://your-url/install.sh | bash

pkg update -y && pkg install -y nodejs git && npm install -g mylittle-jarvis && jarvis --setup

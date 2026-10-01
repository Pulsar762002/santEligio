# Ambiente di compilazione Android (JDK 21 + Android SDK 36), senza installare nulla sul server.
# Usato da build-release.sh.
FROM eclipse-temurin:21-jdk

ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

RUN apt-get update && apt-get install -y --no-install-recommends unzip wget && rm -rf /var/lib/apt/lists/*

# Command line tools Android ufficiali
RUN mkdir -p $ANDROID_HOME/cmdline-tools \
 && wget -q https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip -O /tmp/clt.zip \
 && unzip -q /tmp/clt.zip -d $ANDROID_HOME/cmdline-tools \
 && mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest \
 && rm /tmp/clt.zip

RUN yes | sdkmanager --licenses > /dev/null \
 && sdkmanager "platforms;android-36" "build-tools;36.0.0" "build-tools;35.0.0" "platform-tools" > /dev/null \
 && chmod -R a+rX $ANDROID_HOME

WORKDIR /work/frontend/android

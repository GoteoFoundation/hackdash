#!/bin/sh -x

USER_UID=$(stat -c %u index.js)
USER_GID=$(stat -c %g index.js)

export USER_UID
export USER_GID

usermod -u "$USER_UID" wotify 2> /dev/null
groupmod -g "$USER_GID" wotify 2> /dev/null
usermod -g "$USER_GID" wotify 2> /dev/null

chown -R -h "$USER_UID" "$BUNDLE_PATH"
chgrp -R -h "$USER_GID" "$BUNDLE_PATH"

/usr/bin/sudo -EH -u wotify "$@"

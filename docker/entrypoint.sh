#!/bin/sh
./docker/wait-for.sh ${DB_HOST}:${DB_PORT} -- echo "[info]: PostgreSQL is up at ${DB_HOST} on ${DB_PORT}"

if [ $? -ne 0 ]; then
    exit 1;
fi

if [ "$NODE_ENV" != "local" ] && [ "$NODE_ENV" != "jenkins" ]; then
  echo "[info]: Read secrets"
  envVarAssignments=$(node docker/readSecrets.js) 
  export $envVarAssignments
fi

if [ "$NODE_ENV" = "jenkins" ] && [ -n "$DOCKER_RUN_MIGRATIONS" ]; then
  export IS_MIGRATION=true
  echo "[info]: Running DB migrations"
  npm run db:migrate && echo "[info]: Migration completed successfully"
  if [ $? -ne 0 ]; then
      exit 1;
  fi
  export IS_MIGRATION=false
fi

if ! [ -n "$DOCKER_COMMAND" ]; then
    DOCKER_COMMAND=${@}
fi

echo "[info]: Starting application with command - \"${DOCKER_COMMAND}\""
${DOCKER_COMMAND}

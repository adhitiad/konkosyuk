#!/usr/bin/env bash
set -euo pipefail

PROTO_DIR="proto"
GEN_DIR="src/gen"

mkdir -p "$GEN_DIR"

echo "Generating TypeScript gRPC stubs with ts-proto..."

npx protoc \
  --plugin=protoc-gen-ts_proto="$(npm bin)/protoc-gen-ts_proto" \
  --ts_proto_out="$GEN_DIR" \
  --ts_proto_opt="outputServices=grpc-js,useExactTypes=false,useOptionals=false,snakeToCamel=true,oneofType=union" \
  -I "$PROTO_DIR" \
  "$PROTO_DIR"/konkosyuk/v1/*.proto

echo "Proto generation complete: $GEN_DIR"

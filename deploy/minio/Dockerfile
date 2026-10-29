FROM golang:1.24.8-alpine3.22 AS build

ARG MINIO_VERSION=RELEASE.2025-10-15T17-29-55Z
ARG MC_VERSION=RELEASE.2025-08-13T08-35-41Z
ENV CGO_ENABLED=0 GOTOOLCHAIN=local

RUN apk add --no-cache ca-certificates git && \
    go install github.com/minio/minio@${MINIO_VERSION} && \
    go install github.com/minio/mc@${MC_VERSION}

FROM alpine:3.22.2
RUN apk add --no-cache ca-certificates curl && addgroup -S minio && adduser -S -G minio -u 10001 minio
COPY --from=build /go/bin/minio /usr/local/bin/minio
COPY --from=build /go/bin/mc /usr/local/bin/mc
USER minio
EXPOSE 9000 9001
VOLUME ["/data"]
ENTRYPOINT ["minio"]
CMD ["server", "/data"]

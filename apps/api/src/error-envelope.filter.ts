import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

const statusCodes: Readonly<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: "validation_error",
  [HttpStatus.UNAUTHORIZED]: "unauthorized",
  [HttpStatus.FORBIDDEN]: "forbidden",
  [HttpStatus.NOT_FOUND]: "not_found",
  [HttpStatus.CONFLICT]: "conflict",
  [HttpStatus.PAYLOAD_TOO_LARGE]: "payload_too_large",
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: "unsupported_media_type",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "unprocessable_entity",
  [HttpStatus.TOO_MANY_REQUESTS]: "rate_limited",
  [HttpStatus.SERVICE_UNAVAILABLE]: "service_unavailable",
};

@Catch()
export class ErrorEnvelopeFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const response = http.getResponse<FastifyReply>();
    const status = this.statusOf(exception);
    const safeStatus = Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
    const code =
      statusCodes[safeStatus] ?? (safeStatus >= 500 ? "internal_error" : "request_error");
    const message =
      safeStatus >= 500 ? "The request could not be completed" : this.safeMessage(exception);

    void response.status(safeStatus).send({ code, message, requestId: request.id });
  }

  private statusOf(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    if (typeof exception !== "object" || exception === null) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
    if ("getStatus" in exception && typeof exception.getStatus === "function") {
      return Number(exception.getStatus());
    }
    if ("statusCode" in exception) {
      return Number(exception.statusCode);
    }
    if ("status" in exception) {
      return Number(exception.status);
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private safeMessage(exception: unknown): string {
    if (!(exception instanceof HttpException)) {
      return "The request could not be completed";
    }
    const response = exception.getResponse();
    if (typeof response === "string") {
      return response;
    }
    if (typeof response === "object" && response !== null && "message" in response) {
      const message = response.message;
      return Array.isArray(message) ? "Request validation failed" : String(message);
    }
    return "The request could not be completed";
  }
}

import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IPollFunctions,
} from 'n8n-workflow';

export const BASE_URL = 'https://api.ffmpeg-micro.com';

/**
 * Terminal job statuses. A job in one of these states will not change again.
 */
export const TERMINAL_STATUSES = ['completed', 'failed', 'canceled'];

/**
 * MIME types accepted by POST /v1/upload/presigned-url. Mirrors the server's
 * getAllSupportedMimeTypes() in apps/api-gateway/src/validation/fileFormats.ts.
 */
export const SUPPORTED_UPLOAD_MIME_TYPES = [
	{ name: 'MP4 Video (video/mp4)', value: 'video/mp4' },
	{ name: 'WebM Video (video/webm)', value: 'video/webm' },
	{ name: 'MOV Video (video/quicktime)', value: 'video/quicktime' },
	{ name: 'AVI Video (video/x-msvideo)', value: 'video/x-msvideo' },
	{ name: 'MP3 Audio (audio/mpeg)', value: 'audio/mpeg' },
	{ name: 'M4A Audio (audio/mp4)', value: 'audio/mp4' },
	{ name: 'AAC Audio (audio/aac)', value: 'audio/aac' },
	{ name: 'WAV Audio (audio/wav)', value: 'audio/wav' },
	{ name: 'OGG Audio (audio/ogg)', value: 'audio/ogg' },
	{ name: 'Opus Audio (audio/opus)', value: 'audio/opus' },
	{ name: 'FLAC Audio (audio/flac)', value: 'audio/flac' },
	{ name: 'JPEG Image (image/jpeg)', value: 'image/jpeg' },
	{ name: 'PNG Image (image/png)', value: 'image/png' },
	{ name: 'GIF Image (image/gif)', value: 'image/gif' },
	{ name: 'WebP Image (image/webp)', value: 'image/webp' },
];

/**
 * Output formats accepted by POST /v1/transcodes. Mirrors the server's
 * FILE_FORMATS table (formats with supportedAsOutput: true).
 */
export const SUPPORTED_OUTPUT_FORMATS = [
	{ name: 'MP4 (Video)', value: 'mp4' },
	{ name: 'WebM (Video)', value: 'webm' },
	{ name: 'MOV (Video)', value: 'mov' },
	{ name: 'AVI (Video)', value: 'avi' },
	{ name: 'MP3 (Audio)', value: 'mp3' },
	{ name: 'M4A (Audio)', value: 'm4a' },
	{ name: 'AAC (Audio)', value: 'aac' },
	{ name: 'WAV (Audio)', value: 'wav' },
	{ name: 'OGG (Audio)', value: 'ogg' },
	{ name: 'Opus (Audio)', value: 'opus' },
	{ name: 'FLAC (Audio)', value: 'flac' },
	{ name: 'JPEG (Image)', value: 'jpg' },
	{ name: 'PNG (Image)', value: 'png' },
	{ name: 'GIF (Image)', value: 'gif' },
	{ name: 'WebP (Image)', value: 'webp' },
];

/**
 * Make an authenticated request to the FFmpeg Micro API.
 */
export async function ffmpegMicroApiRequest(
	this: IExecuteFunctions | IPollFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${endpoint}`,
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}
	if (qs && Object.keys(qs).length > 0) {
		options.qs = qs;
	}

	return (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'ffmpegMicroApi',
		options,
	)) as IDataObject;
}

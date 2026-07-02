import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError, jsonParse, sleep } from 'n8n-workflow';

import {
	customApiCallProperties,
	customOperations,
	fileOperations,
	fileUploadProperties,
	jobIdProperties,
	resourceProperty,
	transcodeCreateProperties,
	transcodeListProperties,
	transcodeOperations,
	transcribeCreateProperties,
	transcribeListProperties,
	transcribeOperations,
	waitProperties,
} from './descriptions';
import { TERMINAL_STATUSES, ffmpegMicroApiRequest } from './GenericFunctions';

type OptionPair = { option: string; argument?: string };

function collectOptionPairs(raw: IDataObject | undefined): OptionPair[] {
	const entries = ((raw as IDataObject)?.option as IDataObject[]) ?? [];
	return entries.map((entry) => {
		const pair: OptionPair = { option: entry.option as string };
		if (entry.argument !== undefined && entry.argument !== '') {
			pair.argument = entry.argument as string;
		}
		return pair;
	});
}

export class FfmpegMicro implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FFmpeg Micro',
		name: 'ffmpegMicro',
		icon: { light: 'file:ffmpegMicro.svg', dark: 'file:ffmpegMicro.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Transcode video and audio, generate subtitles, and manage media files with the FFmpeg Micro API',
		defaults: {
			name: 'FFmpeg Micro',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'ffmpegMicroApi',
				required: true,
			},
		],
		properties: [
			resourceProperty,
			transcodeOperations,
			transcribeOperations,
			fileOperations,
			customOperations,
			...jobIdProperties,
			...transcodeCreateProperties,
			...transcodeListProperties,
			...waitProperties,
			...transcribeCreateProperties,
			...transcribeListProperties,
			...fileUploadProperties,
			...customApiCallProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[] | undefined;

				if (resource === 'transcode') {
					responseData = await executeTranscode.call(this, operation, i);
				} else if (resource === 'transcribe') {
					responseData = await executeTranscribe.call(this, operation, i);
				} else if (resource === 'file') {
					responseData = await executeFileUpload.call(this, i);
				} else if (resource === 'custom') {
					responseData = await executeCustomApiCall.call(this, i);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData ?? {}),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				const wrappedError =
					error instanceof NodeApiError || error instanceof NodeOperationError
						? error
						: new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				throw wrappedError;
			}
		}

		return [returnData];
	}
}

async function executeTranscode(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'create') {
		const inputsCollection = this.getNodeParameter('inputs', i) as IDataObject;
		const inputEntries = (inputsCollection.input as IDataObject[]) ?? [];
		if (inputEntries.length === 0) {
			throw new NodeOperationError(this.getNode(), 'At least one input is required', {
				itemIndex: i,
			});
		}

		const inputs = inputEntries.map((entry) => {
			const input: IDataObject = { url: entry.url };
			const perInputOptions = collectOptionPairs(entry.options as IDataObject);
			if (perInputOptions.length > 0) {
				input.options = perInputOptions;
			}
			return input;
		});

		const body: IDataObject = {
			inputs,
			outputFormat: this.getNodeParameter('outputFormat', i) as string,
			preset: {
				quality: this.getNodeParameter('quality', i) as string,
				resolution: this.getNodeParameter('resolution', i) as string,
			},
		};

		const options = collectOptionPairs(this.getNodeParameter('options', i, {}) as IDataObject);
		if (options.length > 0) {
			body.options = options;
		}

		const filtersCollection = this.getNodeParameter('filters', i, {}) as IDataObject;
		const filterEntries = (filtersCollection.filter as IDataObject[]) ?? [];
		if (filterEntries.length > 0) {
			body.filters = filterEntries.map((entry) => ({ filter: entry.filter }));
		}

		return await ffmpegMicroApiRequest.call(this, 'POST', '/v1/transcodes', body);
	}

	if (operation === 'get') {
		const jobId = this.getNodeParameter('jobId', i) as string;
		return await ffmpegMicroApiRequest.call(this, 'GET', `/v1/transcodes/${jobId}`);
	}

	if (operation === 'getDownloadUrl') {
		const jobId = this.getNodeParameter('jobId', i) as string;
		return await ffmpegMicroApiRequest.call(this, 'GET', `/v1/transcodes/${jobId}/download`);
	}

	if (operation === 'cancel') {
		const jobId = this.getNodeParameter('jobId', i) as string;
		return await ffmpegMicroApiRequest.call(this, 'PATCH', `/v1/transcodes/${jobId}/cancel`);
	}

	if (operation === 'list') {
		const qs: IDataObject = { limit: this.getNodeParameter('limit', i) as number };
		const status = this.getNodeParameter('status', i, '') as string;
		const since = this.getNodeParameter('since', i, '') as string;
		if (status) qs.status = status;
		if (since) qs.since = since;
		const response = await ffmpegMicroApiRequest.call(this, 'GET', '/v1/transcodes', undefined, qs);
		return (response.items as IDataObject[]) ?? [];
	}

	if (operation === 'wait') {
		return await waitForJob.call(this, i, '/v1/transcodes');
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
		itemIndex: i,
	});
}

async function executeTranscribe(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'create') {
		const body: IDataObject = {
			media_url: this.getNodeParameter('mediaUrl', i) as string,
		};
		const language = this.getNodeParameter('language', i, '') as string;
		const task = this.getNodeParameter('task', i, 'transcribe') as string;
		if (language) body.language = language;
		if (task) body.task = task;
		return await ffmpegMicroApiRequest.call(this, 'POST', '/v1/transcribe', body);
	}

	if (operation === 'get') {
		const jobId = this.getNodeParameter('jobId', i) as string;
		return await ffmpegMicroApiRequest.call(this, 'GET', `/v1/transcribe/${jobId}`);
	}

	if (operation === 'getDownloadUrl') {
		const jobId = this.getNodeParameter('jobId', i) as string;
		return await ffmpegMicroApiRequest.call(this, 'GET', `/v1/transcribe/${jobId}/download`);
	}

	if (operation === 'list') {
		const qs: IDataObject = { limit: this.getNodeParameter('limit', i) as number };
		const status = this.getNodeParameter('status', i, '') as string;
		const since = this.getNodeParameter('since', i, '') as string;
		if (status) qs.status = status;
		if (since) qs.since = since;
		const response = await ffmpegMicroApiRequest.call(
			this,
			'GET',
			'/v1/transcribes',
			undefined,
			qs,
		);
		return (response.items as IDataObject[]) ?? [];
	}

	if (operation === 'wait') {
		return await waitForJob.call(this, i, '/v1/transcribe');
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
		itemIndex: i,
	});
}

async function waitForJob(
	this: IExecuteFunctions,
	i: number,
	endpointBase: string,
): Promise<IDataObject> {
	const jobId = this.getNodeParameter('jobId', i) as string;
	const pollIntervalMs = (this.getNodeParameter('pollInterval', i, 4) as number) * 1000;
	const timeoutMs = (this.getNodeParameter('timeout', i, 300) as number) * 1000;
	const start = Date.now();

	for (;;) {
		const job = await ffmpegMicroApiRequest.call(this, 'GET', `${endpointBase}/${jobId}`);
		if (TERMINAL_STATUSES.includes(job.status as string)) {
			return job;
		}
		if (Date.now() - start + pollIntervalMs > timeoutMs) {
			throw new NodeOperationError(
				this.getNode(),
				`Job ${jobId} did not finish within the timeout. Last status: ${job.status as string}. For long-running jobs, use the FFmpeg Micro Trigger node instead.`,
				{ itemIndex: i },
			);
		}
		await sleep(pollIntervalMs);
	}
}

async function executeFileUpload(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
	const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

	const filename =
		(this.getNodeParameter('filename', i, '') as string) || binaryData.fileName || '';
	if (!filename) {
		throw new NodeOperationError(
			this.getNode(),
			'Set a filename: the binary data has no filename and none was provided',
			{ itemIndex: i },
		);
	}

	const contentTypeParam = this.getNodeParameter('contentType', i, 'auto') as string;
	const contentType = contentTypeParam === 'auto' ? binaryData.mimeType : contentTypeParam;

	// Step 1: request a presigned upload URL
	const presign = await ffmpegMicroApiRequest.call(this, 'POST', '/v1/upload/presigned-url', {
		filename,
		contentType,
		fileSize: buffer.length,
	});
	const presignResult = presign.result as IDataObject;
	const uploadUrl = presignResult?.uploadUrl as string;
	const storedFilename = presignResult?.filename as string;
	if (!uploadUrl || !storedFilename) {
		throw new NodeOperationError(this.getNode(), 'The presigned upload request returned no URL', {
			itemIndex: i,
		});
	}

	// Step 2: upload the binary directly to storage. This request is deliberately
	// unauthenticated: the presigned URL carries its own signature, and the API
	// key must never be sent to the storage host.
	await this.helpers.httpRequest({
		method: 'PUT',
		url: uploadUrl,
		body: buffer,
		headers: { 'Content-Type': contentType },
	});

	// Step 3: confirm the upload to finalize and probe the file
	const confirm = await ffmpegMicroApiRequest.call(this, 'POST', '/v1/upload/confirm', {
		filename: storedFilename,
		fileSize: buffer.length,
	});
	return (confirm.result as IDataObject) ?? confirm;
}

async function executeCustomApiCall(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const path = this.getNodeParameter('url', i) as string;
	if (!path.startsWith('/')) {
		throw new NodeOperationError(
			this.getNode(),
			'The URL must be a path starting with /, for example /v1/transcodes',
			{ itemIndex: i },
		);
	}

	const method = this.getNodeParameter('method', i) as IHttpRequestMethods;

	const qs: IDataObject = {};
	const qsCollection = this.getNodeParameter('qs', i, {}) as IDataObject;
	for (const entry of (qsCollection.parameter as IDataObject[]) ?? []) {
		qs[entry.key as string] = entry.value;
	}

	let body: IDataObject | undefined;
	if (['POST', 'PUT', 'PATCH'].includes(method)) {
		const rawBody = this.getNodeParameter('body', i, '') as string | IDataObject;
		if (typeof rawBody === 'string' && rawBody.trim() !== '') {
			body = jsonParse<IDataObject>(rawBody, {
				errorMessage: 'The request body is not valid JSON',
			});
		} else if (typeof rawBody === 'object' && rawBody !== null) {
			body = rawBody as IDataObject;
		}
	}

	return await ffmpegMicroApiRequest.call(this, method, path, body, qs);
}

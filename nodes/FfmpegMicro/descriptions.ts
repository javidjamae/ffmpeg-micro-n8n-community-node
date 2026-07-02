import type { INodeProperties } from 'n8n-workflow';

import { SUPPORTED_OUTPUT_FORMATS, SUPPORTED_UPLOAD_MIME_TYPES } from './GenericFunctions';

export const resourceProperty: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{ name: 'Transcode', value: 'transcode' },
		{ name: 'Transcription', value: 'transcribe' },
		{ name: 'File', value: 'file' },
		{ name: 'Custom API Call', value: 'custom' },
	],
	default: 'transcode',
};

export const transcodeOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['transcode'] } },
	options: [
		{
			name: 'Cancel',
			value: 'cancel',
			description: 'Cancel a pending or running transcode job',
			action: 'Cancel a transcode job',
		},
		{
			name: 'Create',
			value: 'create',
			description: 'Queue a new video or audio transcode job',
			action: 'Create a transcode job',
		},
		{
			name: 'Get',
			value: 'get',
			description: 'Retrieve the status and details of a transcode job',
			action: 'Get a transcode job',
		},
		{
			name: 'Get Download URL',
			value: 'getDownloadUrl',
			description: 'Get a signed download URL for a completed transcode job',
			action: 'Get a transcode download URL',
		},
		{
			name: 'List',
			value: 'list',
			description: 'List transcode jobs with optional filters',
			action: 'List transcode jobs',
		},
		{
			name: 'Wait for Completion',
			value: 'wait',
			description: 'Poll a transcode job until it reaches a terminal status',
			action: 'Wait for a transcode job',
		},
	],
	default: 'create',
};

export const transcribeOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['transcribe'] } },
	options: [
		{
			name: 'Create',
			value: 'create',
			description: 'Generate an SRT subtitle file from a video or audio URL',
			action: 'Create a transcription job',
		},
		{
			name: 'Get',
			value: 'get',
			description: 'Retrieve the status of a transcription job',
			action: 'Get a transcription job',
		},
		{
			name: 'Get Download URL',
			value: 'getDownloadUrl',
			description: 'Get a signed URL to download the SRT subtitle file',
			action: 'Get a transcription download URL',
		},
		{
			name: 'List',
			value: 'list',
			description: 'List transcription jobs',
			action: 'List transcription jobs',
		},
		{
			name: 'Wait for Completion',
			value: 'wait',
			description: 'Poll a transcription job until it reaches a terminal status',
			action: 'Wait for a transcription job',
		},
	],
	default: 'create',
};

export const fileOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['file'] } },
	options: [
		{
			name: 'Upload',
			value: 'upload',
			description:
				'Upload a file to FFmpeg Micro storage and get a gs:// URL to use as input for other operations',
			action: 'Upload a file',
		},
	],
	default: 'upload',
};

export const customOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['custom'] } },
	options: [
		{
			name: 'Make an API Call',
			value: 'apiCall',
			description: 'Call any FFmpeg Micro API endpoint. Authentication is handled for you.',
			action: 'Make an API call',
		},
	],
	default: 'apiCall',
};

const jobIdProperty = (resource: string, operations: string[]): INodeProperties => ({
	displayName: 'Job ID',
	name: 'jobId',
	type: 'string',
	required: true,
	default: '',
	description: 'The ID of the job',
	displayOptions: { show: { resource: [resource], operation: operations } },
});

export const transcodeCreateProperties: INodeProperties[] = [
	{
		displayName: 'Inputs',
		name: 'inputs',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, sortable: true },
		placeholder: 'Add Input',
		required: true,
		default: { input: [{ url: '' }] },
		description:
			'One or more input media sources. Up to 10 inputs are supported: a single input for transcoding, multiple inputs for compositions like concat or audio overlay.',
		displayOptions: { show: { resource: ['transcode'], operation: ['create'] } },
		options: [
			{
				displayName: 'Input',
				name: 'input',
				values: [
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'https://example.com/video.mp4 or gs://bucket/file.mp4',
						description:
							'GCS URL (gs://bucket/object) from a file upload, or a public HTTP(S) URL',
					},
					{
						displayName: 'Input Options',
						name: 'options',
						type: 'fixedCollection',
						typeOptions: { multipleValues: true },
						placeholder: 'Add Input Option',
						default: {},
						description:
							'FFmpeg flags applied to this specific input, such as -stream_loop or -itsoffset',
						options: [
							{
								displayName: 'Option',
								name: 'option',
								values: [
									{
										displayName: 'Option',
										name: 'option',
										type: 'string',
										required: true,
										default: '',
										placeholder: '-stream_loop',
									},
									{
										displayName: 'Argument',
										name: 'argument',
										type: 'string',
										default: '',
										description: 'Leave empty for flag-only options',
									},
								],
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Output Format',
		name: 'outputFormat',
		type: 'options',
		required: true,
		default: 'mp4',
		options: SUPPORTED_OUTPUT_FORMATS,
		description: 'File format for the output',
		displayOptions: { show: { resource: ['transcode'], operation: ['create'] } },
	},
	{
		displayName: 'Quality',
		name: 'quality',
		type: 'options',
		default: 'medium',
		options: [
			{ name: 'High', value: 'high' },
			{ name: 'Medium', value: 'medium' },
			{ name: 'Low', value: 'low' },
		],
		description:
			'Maps to CRF (high=18, medium=23, low=28). Ignored when FFmpeg options are provided.',
		displayOptions: { show: { resource: ['transcode'], operation: ['create'] } },
	},
	{
		displayName: 'Resolution',
		name: 'resolution',
		type: 'options',
		default: '1080p',
		options: [
			{ name: '480p', value: '480p' },
			{ name: '720p', value: '720p' },
			{ name: '1080p', value: '1080p' },
			{ name: '4K', value: '4k' },
		],
		description: 'Output resolution. Ignored when FFmpeg options are provided.',
		displayOptions: { show: { resource: ['transcode'], operation: ['create'] } },
	},
	{
		displayName: 'FFmpeg Options',
		name: 'options',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, sortable: true },
		placeholder: 'Add Option',
		default: {},
		description:
			'Custom FFmpeg flags or virtual options. When set, these override Quality and Resolution. Use virtual options (@text-overlay, @quote-card) for high-level effects, or raw FFmpeg flags (-vf, -c:v, -crf) for full control.',
		displayOptions: { show: { resource: ['transcode'], operation: ['create'] } },
		options: [
			{
				displayName: 'Option',
				name: 'option',
				values: [
					{
						displayName: 'Option',
						name: 'option',
						type: 'string',
						required: true,
						default: '',
						placeholder: '-vf',
						description:
							'FFmpeg flag or virtual option, for example -vf, -c:v, -crf, @text-overlay, or @quote-card',
					},
					{
						displayName: 'Argument',
						name: 'argument',
						type: 'string',
						default: '',
						placeholder: 'scale=1280:720',
						description:
							'Argument value for the option. Plain text for FFmpeg flags or a JSON object for virtual options. Leave empty for flag-only options like -shortest or -an.',
					},
				],
			},
		],
	},
	{
		displayName: 'Composition Filters',
		name: 'filters',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, sortable: true },
		placeholder: 'Add Filter',
		default: {},
		description:
			'Composition filter graphs for combining multiple inputs. Each entry is a single FFmpeg filter graph string sent as -filter_complex on the server.',
		displayOptions: { show: { resource: ['transcode'], operation: ['create'] } },
		options: [
			{
				displayName: 'Filter',
				name: 'filter',
				values: [
					{
						displayName: 'Filter Graph',
						name: 'filter',
						type: 'string',
						required: true,
						default: '',
						placeholder: '[0:v][1:v]concat=n=2:v=1:a=0[v]',
						description:
							'FFmpeg filter graph expression, for example a concat chain to join videos end-to-end or an xfade chain for crossfade transitions',
					},
				],
			},
		],
	},
];

export const transcodeListProperties: INodeProperties[] = [
	{
		displayName: 'Status Filter',
		name: 'status',
		type: 'options',
		default: '',
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Canceled', value: 'canceled' },
			{ name: 'Completed', value: 'completed' },
			{ name: 'Failed', value: 'failed' },
			{ name: 'Pending', value: 'pending' },
			{ name: 'Processing', value: 'processing' },
			{ name: 'Queued', value: 'queued' },
		],
		displayOptions: { show: { resource: ['transcode'], operation: ['list'] } },
	},
	{
		displayName: 'Since',
		name: 'since',
		type: 'dateTime',
		default: '',
		description: 'Return only jobs updated at or after this date and time',
		displayOptions: { show: { resource: ['transcode'], operation: ['list'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: { resource: ['transcode', 'transcribe'], operation: ['list'] },
		},
	},
];

export const waitProperties: INodeProperties[] = [
	{
		displayName: 'Poll Interval (Seconds)',
		name: 'pollInterval',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 60 },
		default: 4,
		description: 'How often to check the job status',
		displayOptions: {
			show: { resource: ['transcode', 'transcribe'], operation: ['wait'] },
		},
	},
	{
		displayName: 'Timeout (Seconds)',
		name: 'timeout',
		type: 'number',
		typeOptions: { minValue: 10, maxValue: 3600 },
		default: 300,
		description:
			'Maximum time to wait for the job to finish before the node fails. Long-running jobs are better handled with the FFmpeg Micro Trigger node.',
		displayOptions: {
			show: { resource: ['transcode', 'transcribe'], operation: ['wait'] },
		},
	},
];

export const transcribeCreateProperties: INodeProperties[] = [
	{
		displayName: 'Media URL',
		name: 'mediaUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/audio.mp3 or gs://bucket/file.mp4',
		description: 'URL of the audio or video file to transcribe (https:// or gs://)',
		displayOptions: { show: { resource: ['transcribe'], operation: ['create'] } },
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'string',
		default: '',
		placeholder: 'en',
		description:
			'ISO 639-1 language code of the source audio, for example en, es, fr, de, ja. Leave empty to auto-detect. Whisper supports about 99 languages.',
		displayOptions: { show: { resource: ['transcribe'], operation: ['create'] } },
	},
	{
		displayName: 'Task',
		name: 'task',
		type: 'options',
		default: 'transcribe',
		options: [
			{ name: 'Transcribe (Keep Source Language)', value: 'transcribe' },
			{ name: 'Translate to English', value: 'translate' },
		],
		displayOptions: { show: { resource: ['transcribe'], operation: ['create'] } },
	},
];

export const transcribeListProperties: INodeProperties[] = [
	{
		displayName: 'Status Filter',
		name: 'status',
		type: 'options',
		default: '',
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Completed', value: 'completed' },
			{ name: 'Failed', value: 'failed' },
			{ name: 'Pending', value: 'pending' },
			{ name: 'Processing', value: 'processing' },
		],
		displayOptions: { show: { resource: ['transcribe'], operation: ['list'] } },
	},
	{
		displayName: 'Since',
		name: 'since',
		type: 'dateTime',
		default: '',
		description: 'Return only jobs updated at or after this date and time',
		displayOptions: { show: { resource: ['transcribe'], operation: ['list'] } },
	},
];

export const fileUploadProperties: INodeProperties[] = [
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		description: 'Name of the binary property that contains the file to upload',
		displayOptions: { show: { resource: ['file'], operation: ['upload'] } },
	},
	{
		displayName: 'Filename',
		name: 'filename',
		type: 'string',
		default: '',
		placeholder: 'clip.mp4',
		description:
			'Filename including extension, used as the storage key. Leave empty to use the filename from the binary data.',
		displayOptions: { show: { resource: ['file'], operation: ['upload'] } },
	},
	{
		displayName: 'Content Type',
		name: 'contentType',
		type: 'options',
		default: 'auto',
		options: [
			{ name: 'From Binary Data (Auto)', value: 'auto' },
			...SUPPORTED_UPLOAD_MIME_TYPES,
		],
		description:
			'MIME type of the file. Auto uses the MIME type reported by the binary data.',
		displayOptions: { show: { resource: ['file'], operation: ['upload'] } },
	},
];

export const customApiCallProperties: INodeProperties[] = [
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/v1/transcodes',
		description:
			'Path relative to https://api.ffmpeg-micro.com. Authentication headers are added for you.',
		displayOptions: { show: { resource: ['custom'], operation: ['apiCall'] } },
	},
	{
		displayName: 'Method',
		name: 'method',
		type: 'options',
		default: 'GET',
		options: [
			{ name: 'DELETE', value: 'DELETE' },
			{ name: 'GET', value: 'GET' },
			{ name: 'PATCH', value: 'PATCH' },
			{ name: 'POST', value: 'POST' },
			{ name: 'PUT', value: 'PUT' },
		],
		displayOptions: { show: { resource: ['custom'], operation: ['apiCall'] } },
	},
	{
		displayName: 'Query Parameters',
		name: 'qs',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Parameter',
		default: {},
		displayOptions: { show: { resource: ['custom'], operation: ['apiCall'] } },
		options: [
			{
				displayName: 'Parameter',
				name: 'parameter',
				values: [
					{ displayName: 'Key', name: 'key', type: 'string', default: '' },
					{ displayName: 'Value', name: 'value', type: 'string', default: '' },
				],
			},
		],
	},
	{
		displayName: 'Body (JSON)',
		name: 'body',
		type: 'json',
		default: '',
		description: 'JSON request body for POST, PUT, and PATCH requests',
		displayOptions: {
			show: { resource: ['custom'], operation: ['apiCall'], method: ['POST', 'PUT', 'PATCH'] },
		},
	},
];

export const jobIdProperties: INodeProperties[] = [
	jobIdProperty('transcode', ['get', 'getDownloadUrl', 'cancel', 'wait']),
	jobIdProperty('transcribe', ['get', 'getDownloadUrl', 'wait']),
];

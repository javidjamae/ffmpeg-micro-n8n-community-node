import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class FfmpegMicroApi implements ICredentialType {
	name = 'ffmpegMicroApi';

	displayName = 'FFmpeg Micro API';

	icon: Icon = { light: 'file:ffmpegMicro.svg', dark: 'file:ffmpegMicro.dark.svg' };

	documentationUrl = 'https://www.ffmpeg-micro.com/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your FFmpeg Micro API key. Generate one in the <a href="https://www.ffmpeg-micro.com/dashboard/api-keys?utm_source=n8n&utm_medium=community_node&utm_campaign=ffmpeg_micro_node" target="_blank">FFmpeg Micro dashboard</a>.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.ffmpeg-micro.com',
			url: '/v1/transcodes',
			qs: { limit: 1 },
		},
	};
}

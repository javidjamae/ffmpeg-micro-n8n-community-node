import type {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { ffmpegMicroApiRequest } from '../FfmpegMicro/GenericFunctions';

export class FfmpegMicroTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FFmpeg Micro Trigger',
		name: 'ffmpegMicroTrigger',
		icon: { light: 'file:ffmpegMicroTrigger.svg', dark: 'file:ffmpegMicroTrigger.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["jobType"]}}',
		description: 'Starts a workflow when FFmpeg Micro jobs reach completed or failed status',
		defaults: {
			name: 'FFmpeg Micro Trigger',
		},
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'ffmpegMicroApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Job Type',
				name: 'jobType',
				type: 'options',
				default: 'transcode',
				options: [
					{ name: 'Transcode', value: 'transcode' },
					{ name: 'Transcription', value: 'transcribe' },
				],
				description: 'Which kind of job to watch',
			},
			{
				displayName: 'Watch for Status',
				name: 'status',
				type: 'options',
				default: 'completed',
				options: [
					{ name: 'Completed', value: 'completed' },
					{ name: 'Completed or Failed', value: 'completed,failed' },
					{ name: 'Failed', value: 'failed' },
				],
				description:
					'Which terminal status to watch for. Failed jobs include an error_message field with the failure reason.',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 100 },
				default: 50,
				description: 'Max number of results to return',
			},
		],
		usableAsTool: true,
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const jobType = this.getNodeParameter('jobType') as string;
		const status = this.getNodeParameter('status') as string;
		const limit = this.getNodeParameter('limit') as number;

		const endpoint = jobType === 'transcribe' ? '/v1/transcribes' : '/v1/transcodes';
		const staticData = this.getWorkflowStaticData('node') as {
			lastCursor?: string;
			seenIds?: string[];
		};

		// The server only filters on a single status value, so "completed,failed"
		// is fetched as one request per status and merged here.
		const statuses = status.split(',');
		let jobs: IDataObject[] = [];
		for (const singleStatus of statuses) {
			const qs: IDataObject = { status: singleStatus, limit };
			if (staticData.lastCursor) {
				qs.since = staticData.lastCursor;
			}
			const response = await ffmpegMicroApiRequest.call(this, 'GET', endpoint, undefined, qs);
			jobs = jobs.concat((response.items as IDataObject[]) ?? []);
		}

		// The server's `since` filter is inclusive (updated_at >= since), so jobs
		// sitting exactly on the cursor boundary come back again. Deduplicate.
		const seenIds = new Set(staticData.seenIds ?? []);
		jobs = jobs.filter((job) => !seenIds.has(job.id as string));

		if (this.getMode() === 'manual') {
			// When the user tests the trigger, return the most recent job without
			// touching the cursor, so production polling is unaffected.
			const newestFirst = [...jobs].sort((a, b) =>
				((b.updated_at as string) ?? '').localeCompare((a.updated_at as string) ?? ''),
			);
			return newestFirst.length > 0 ? [this.helpers.returnJsonArray([newestFirst[0]])] : null;
		}

		if (jobs.length === 0) {
			return null;
		}

		// Advance the cursor to the newest updated_at we have seen and remember
		// the IDs at that boundary for the next inclusive query.
		const timestamps = jobs
			.map((job) => job.updated_at as string)
			.filter(Boolean)
			.sort();
		const newestTimestamp = timestamps[timestamps.length - 1];
		if (newestTimestamp) {
			staticData.lastCursor = newestTimestamp;
			staticData.seenIds = jobs
				.filter((job) => job.updated_at === newestTimestamp)
				.map((job) => job.id as string);
		}

		// Oldest first so downstream nodes process jobs in completion order
		jobs.sort((a, b) =>
			((a.updated_at as string) ?? '').localeCompare((b.updated_at as string) ?? ''),
		);

		return [this.helpers.returnJsonArray(jobs)];
	}
}

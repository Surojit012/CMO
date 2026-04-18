/**
 * This script creates an n8n workflow for the CMO Daily Growth Engine.
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

if (!N8N_API_KEY) {
  console.error('Error: N8N_API_KEY is not defined in environment variables.');
  process.exit(1);
}

const headers = {
  'X-N8N-API-KEY': N8N_API_KEY,
  'Content-Type': 'application/json',
};

const workflow = {
  name: 'CMO Daily Growth Engine',
  nodes: [
    {
      parameters: {
        rule: {
          interval: [
            {
              field: 'cronExpression',
              expression: '0 9 * * *',
            },
          ],
        },
      },
      id: 'schedule_trigger',
      name: 'Schedule Trigger',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.1,
      position: [200, 300],
    },
    {
      parameters: {
        url: `${APP_URL}/api/autonomous`,
        options: {},
      },
      id: 'get_active_users',
      name: 'Get Active Users',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [400, 300],
    },
    {
      parameters: {
        fieldToSplitOut: 'users',
        options: {},
      },
      id: 'split_users',
      name: 'Split Users',
      type: 'n8n-nodes-base.splitOut',
      typeVersion: 1,
      position: [600, 300],
    },
    {
      parameters: {
        method: 'POST',
        url: `${APP_URL}/api/analyze`,
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: 'url',
              value: '={{ $json.websiteUrl }}',
            },
            {
              name: 'userId',
              value: '={{ $json.userId }}',
            },
          ],
        },
        options: {},
      },
      id: 'run_analysis',
      name: 'Run CMO Analysis',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [800, 300],
    },
    {
      parameters: {
        method: 'POST',
        url: `${APP_URL}/api/publish`,
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: 'platform',
              value: 'devto',
            },
            {
              name: 'content',
              value: '={{ $json.markdown }}',
            },
            {
              name: 'title',
              value: '={{ $json.analysis.title || "AI Growth Report" }}',
            },
          ],
        },
        options: {},
      },
      id: 'publish_devto',
      name: 'Publish Dev.to',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1000, 200],
    },
    {
      parameters: {
        method: 'POST',
        url: `${APP_URL}/api/publish`,
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: 'platform',
              value: 'hashnode',
            },
            {
              name: 'content',
              value: '={{ $json.markdown }}',
            },
            {
              name: 'title',
              value: '={{ $json.analysis.title || "AI Growth Report" }}',
            },
          ],
        },
        options: {},
      },
      id: 'publish_hashnode',
      name: 'Publish Hashnode',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1000, 400],
    },
    {
      parameters: {
        method: 'PATCH',
        url: `${APP_URL}/api/autonomous`,
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: 'userId',
              value: '={{ $node["Split Users"].json.userId }}',
            },
          ],
        },
        options: {},
      },
      id: 'save_report',
      name: 'Save Report',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1250, 300],
    },
  ],
  connections: {
    'Schedule Trigger': {
      main: [
        [
          {
            node: 'Get Active Users',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
    'Get Active Users': {
      main: [
        [
          {
            node: 'Split Users',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
    'Split Users': {
      main: [
        [
          {
            node: 'Run CMO Analysis',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
    'Run CMO Analysis': {
      main: [
        [
          {
            node: 'Publish Dev.to',
            type: 'main',
            index: 0,
          },
          {
            node: 'Publish Hashnode',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
    'Publish Dev.to': {
      main: [
        [
          {
            node: 'Save Report',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
    'Publish Hashnode': {
      main: [
        [
          {
            node: 'Save Report',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
  },
  settings: {
    executionOrder: 'v1',
  },
};

async function setup() {
  try {
    console.log('Creating workflow in n8n...');
    const createRes = await fetch(`${N8N_URL}/workflows`, {
      method: 'POST',
      headers,
      body: JSON.stringify(workflow),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Failed to create workflow: ${err}`);
    }

    const { id } = (await createRes.json()) as { id: string };
    console.log(`Workflow created with ID: ${id}`);

    console.log('Activating workflow...');
    const activateRes = await fetch(`${N8N_URL}/workflows/${id}/activate`, {
      method: 'POST',
      headers,
    });

    if (!activateRes.ok) {
      const err = await activateRes.text();
      console.warn(`Failed to activate workflow: ${err}`);
    } else {
      console.log('Workflow activated successfully!');
    }
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setup();

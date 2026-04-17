import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://maps.googleapis.com/*', () => {
    return HttpResponse.json({ status: 'OK' });
  }),
  http.post('https://graph.facebook.com/v19.0/*/messages', () => {
    return HttpResponse.json({ message_id: 'mock-id' });
  }),
];

export const server = setupServer(...handlers);

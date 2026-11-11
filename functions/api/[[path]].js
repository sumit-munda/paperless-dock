export async function onRequest({ request }) {
  const incomingUrl = new URL(request.url);

  const upstreamUrl = new URL(
    `${incomingUrl.pathname}${incomingUrl.search}`,
    "https://paperless-dock-api.onrender.com"
  );

  return fetch(new Request(upstreamUrl, request));
}

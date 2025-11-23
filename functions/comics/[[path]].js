export async function onRequestGet(context) {
    const { env, params } = context;
    const path = params.path;

    if (!path || path.length === 0) {
        return new Response('Not found', { status: 404 });
    }

    // Construct the key. Since upload.js saves as "comics/...", and this function is mounted at /comics,
    // the params.path will be the part AFTER /comics.
    // Example: Request /comics/123.png -> path=['123.png'] -> key='comics/123.png'
    const objectKey = `comics/${path.join('/')}`;

    try {
        const object = await env.BUCKET.get(objectKey);

        if (!object) {
            return new Response('Not found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        return new Response(object.body, { headers });
    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}

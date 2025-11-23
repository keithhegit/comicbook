export async function onRequestGet(context) {
    const { env } = context;
    const bucket = env.BUCKET;

    try {
        const object = await bucket.get('library.json');

        if (!object) {
            // Return empty list or default if not found
            return new Response(JSON.stringify([]), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const data = await object.json();
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

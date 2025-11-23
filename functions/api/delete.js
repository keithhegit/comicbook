export async function onRequestPost(context) {
    const { request, env } = context;
    const bucket = env.BUCKET;

    try {
        const { comicId } = await request.json();

        if (!comicId) {
            return new Response('Missing comicId', { status: 400 });
        }

        // Get current library
        let library = [];
        const libraryObject = await bucket.get('library.json');
        if (libraryObject) {
            library = await libraryObject.json();
        }

        // Find the comic to delete
        const comicToDelete = library.find(c => c.id === comicId);
        if (!comicToDelete) {
            return new Response('Comic not found', { status: 404 });
        }

        // Delete all images associated with this comic
        for (const imagePath of comicToDelete.images) {
            // Only delete if it's a relative path (uploaded to R2)
            if (!imagePath.startsWith('http')) {
                await bucket.delete(imagePath);
            }
        }

        // Remove comic from library
        library = library.filter(c => c.id !== comicId);

        // Update library.json
        await bucket.put('library.json', JSON.stringify(library));

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const bucket = env.BUCKET;

    try {
        const formData = await request.formData();
        const title = formData.get('title');
        const subtitle = formData.get('subtitle');
        const files = formData.getAll('images');

        if (!title || files.length === 0) {
            return new Response('Missing title or images', { status: 400 });
        }

        const timestamp = Date.now();
        const uploadedImageUrls = [];

        // Upload each file to R2
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filename = `comics/${timestamp}-${i}-${file.name}`;

            await bucket.put(filename, file.stream(), {
                httpMetadata: { contentType: file.type },
            });

            // Construct URL (assuming public access or worker proxy)
            // For public access enabled buckets: https://pub-<hash>.r2.dev/<key>
            // Since we don't know the exact public domain yet, we'll return the key 
            // and let the frontend or a proxy handle it. 
            // OR better: we store the relative path and the frontend knows the base URL.
            // For now, let's assume we serve it via a simple GET proxy or the public URL if configured.
            // Let's store the relative path.
            uploadedImageUrls.push(filename);
        }

        // Update library.json
        const newComic = {
            id: timestamp.toString(),
            title,
            subtitle,
            images: uploadedImageUrls,
            bgm: "https://cdn.freesound.org/previews/258/258667_4486188-lq.mp3" // Default BGM
        };

        let library = [];
        const libraryObject = await bucket.get('library.json');
        if (libraryObject) {
            library = await libraryObject.json();
        }

        library.push(newComic);

        await bucket.put('library.json', JSON.stringify(library));

        return new Response(JSON.stringify(newComic), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

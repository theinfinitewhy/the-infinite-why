(() => {
    const REGISTRY_URL = 'data/articles.json';

    const EXTRA_ARTICLES = [{
        id: 'when-a-line-becomes-a-landscape',
        title: 'When a Line Becomes a Landscape',
        description: 'How decisions drawn on maps become railways, neighbourhoods, walls and borders, and continue shaping lives long after the people who drew them are gone.',
        series: 'ordinary-astonishment',
        seriesLabel: 'Ordinary Astonishment',
        topics: ['History', 'Society', 'Human Rights'],
        url: 'articles/ordinary-astonishment/when-a-line-becomes-a-landscape.html',
        image: 'images/articles/ordinary-astonishment/when-a-line-becomes-a-landscape/when-a-line-becomes-a-landscape.jpg',
        imageAlt: 'A layered, geographically impossible landscape in which railway tracks, cities, mountains, walls and roads overlap and dissolve into one another.',
        status: 'published',
        published: '2026-09-02',
        featured: true
    }];

    const escapeHtml = (value = '') => String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const publishedArticles = (articles) =>
        articles.filter((article) => article.status === 'published');

    const sortByHomeOrder = (articles) => [...articles].sort((a, b) => {
        const aOrder = Number.isFinite(a.homeOrder) ? a.homeOrder : 9999;
        const bOrder = Number.isFinite(b.homeOrder) ? b.homeOrder : 9999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        if (a.published && b.published) return b.published.localeCompare(a.published);
        return a.title.localeCompare(b.title);
    });

    const sortNewestFirst = (articles) => [...articles].sort((a, b) => {
        if (a.published && b.published && a.published !== b.published) {
            return b.published.localeCompare(a.published);
        }
        if (a.published && !b.published) return -1;
        if (!a.published && b.published) return 1;
        return (a.homeOrder ?? 9999) - (b.homeOrder ?? 9999);
    });

    const topicText = (topics = []) => topics.slice(0, 3).join(' · ');

    const cardMarkup = (article) => `
        <article class="story-card">
            <a class="story-image-link" href="${escapeHtml(article.url)}">
                <img
                    class="story-image"
                    src="${escapeHtml(article.image)}"
                    alt="${escapeHtml(article.imageAlt)}"
                    loading="lazy"
                >
            </a>
            <p class="story-topic">${escapeHtml(topicText(article.topics))}</p>
            <h3><a href="${escapeHtml(article.url)}">${escapeHtml(article.title)}</a></h3>
            <p>${escapeHtml(article.description)}</p>
        </article>`;

    const renderFeatured = (article) => {
        const section = document.querySelector('[data-registry-featured]');
        if (!section || !article) return;
        const layout = section.querySelector('.featured-layout');
        if (!layout) return;

        layout.innerHTML = `
            <div class="featured-copy">
                <div class="section-heading-line">
                    <span class="why-mark" aria-hidden="true"></span>
                    <p class="section-label">${escapeHtml(article.seriesLabel)}</p>
                </div>
                <h1>${escapeHtml(article.title)}</h1>
                <p class="featured-standfirst">${escapeHtml(article.description)}</p>
                <a class="text-link" href="${escapeHtml(article.url)}">Read the story</a>
            </div>
            <a
                class="featured-image-link"
                href="${escapeHtml(article.url)}"
                aria-label="Read ${escapeHtml(article.title)}"
            >
                <img
                    class="featured-image"
                    src="${escapeHtml(article.image)}"
                    alt="${escapeHtml(article.imageAlt)}"
                >
            </a>`;
    };

    const renderHomeSeries = (articles, featuredArticle) => {
        document.querySelectorAll('[data-series-grid]').forEach((grid) => {
            const series = grid.dataset.seriesGrid;
            const limit = Number(grid.dataset.limit || 3);
            let items = publishedArticles(articles).filter((article) => article.series === series);

            if (grid.dataset.excludeFeatured === 'true' && featuredArticle) {
                items = items.filter((article) => article.id !== featuredArticle.id);
            }

            items = sortNewestFirst(items).slice(0, limit);
            if (items.length) grid.innerHTML = items.map(cardMarkup).join('');
        });
    };

    const renderArchive = (articles) => {
        const archive = document.querySelector('[data-archive-series]');
        if (!archive) return;
        const series = archive.dataset.archiveSeries;
        const items = sortNewestFirst(
            publishedArticles(articles).filter((article) => article.series === series)
        );
        archive.innerHTML = items.map(cardMarkup).join('');
    };

    const renderTopic = (articles) => {
        const topicGrid = document.querySelector('[data-topic-grid]');
        if (!topicGrid) return;
        const params = new URLSearchParams(window.location.search);
        const topic = params.get('topic');
        const heading = document.querySelector('[data-topic-heading]');
        if (!topic) {
            topicGrid.innerHTML = '<p>Choose a topic to explore.</p>';
            return;
        }
        if (heading) heading.textContent = topic;
        const items = sortNewestFirst(
            publishedArticles(articles).filter((article) =>
                (article.topics || []).some((item) => item.toLowerCase() === topic.toLowerCase())
            )
        );
        topicGrid.innerHTML = items.length
            ? items.map(cardMarkup).join('')
            : '<p>No published stories are listed under this topic yet.</p>';
    };

    const renderSearch = (articles) => {
        const input = document.querySelector('[data-search-input]');
        const results = document.querySelector('[data-search-results]');
        if (!input || !results) return;

        const allArticles = sortNewestFirst(publishedArticles(articles));
        const showResults = () => {
            const query = input.value.trim().toLowerCase();
            if (!query) {
                results.innerHTML = '<p class="search-guidance">Search by title, subject, person or keyword.</p>';
                return;
            }

            const matches = allArticles.filter((article) => [
                article.title,
                article.description,
                article.seriesLabel,
                ...(article.topics || [])
            ].join(' ').toLowerCase().includes(query));

            results.innerHTML = matches.length
                ? matches.map(cardMarkup).join('')
                : '<p class="search-guidance">No published stories matched that search.</p>';
        };

        input.addEventListener('input', showResults);
        showResults();
    };

    async function init() {
        try {
            const response = await fetch(REGISTRY_URL, { cache: 'no-store' });
            if (!response.ok) throw new Error(`Registry request failed: ${response.status}`);
            const data = await response.json();
            const registryArticles = data.articles || [];
            const extraIds = new Set(EXTRA_ARTICLES.map((article) => article.id));
            const articles = registryArticles
                .filter((article) => !extraIds.has(article.id))
                .map((article) => ({ ...article, featured: false }))
                .concat(EXTRA_ARTICLES);
            const featured = publishedArticles(articles).find((article) => article.featured)
                || sortNewestFirst(publishedArticles(articles))[0];

            renderFeatured(featured);
            renderHomeSeries(articles, featured);
            renderArchive(articles);
            renderTopic(articles);
            renderSearch(articles);
        } catch (error) {
            console.error('The Infinite Why article registry could not be loaded.', error);
            // Existing hard-coded homepage content remains visible as a fallback.
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();

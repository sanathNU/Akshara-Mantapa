    //! Axum server for ಅಕ್ಷರ ಮಂಟಪ API

    use axum::{
        extract::{Query, State},
        http::{header, Method, StatusCode},
        response::{IntoResponse, Json},
        routing::get,
        Router,
    };
    use serde::{Deserialize, Serialize};
    use std::sync::Arc;
    use tower_http::cors::{Any, CorsLayer};

    use akshara_mantapa::{
        HierarchicalAddress, LibraryOfBabel, Location,
        CLUSTERS_PER_PAGE, PAGES_PER_BOOK, BOOKS_PER_SHELF,
        SHELVES_PER_WALL, WALLS_PER_ROOM,
    };

    // ============================================================================
    // App State
    // ============================================================================

    #[derive(Clone)]
    struct AppState {
        library: Arc<LibraryOfBabel>,
    }

    // ============================================================================
    // Query Parameters
    // ============================================================================

    #[derive(Deserialize)]
    struct AddressQuery {
        address: String,
    }

    #[derive(Deserialize)]
    struct SearchQuery {
        q: String,
    }

    #[derive(Deserialize)]
    struct VerifyParams {
        address: String,
        text: String,
    }

    // ============================================================================
    // Response Types
    // ============================================================================

    #[derive(Serialize)]
    struct PageResponse {
        raw_address: String,
        hierarchical: HierarchicalDisplay,
        content: String,
        formatted_content: String,
    }

    #[derive(Serialize)]
    struct HierarchicalDisplay {
        mandira_hex: String,
        mandira_kannada: Option<String>,
        gode: u8,
        patti: u8,
        pustaka: u8,
        puta: u16,
        display_string: String,
    }

    #[derive(Serialize)]
    struct SearchResponse {
        query: String,
        found: bool,
        location: Option<LocationResponse>,
        page_preview: Option<String>,
    }

    #[derive(Serialize)]
    struct LocationResponse {
        raw_address: String,
        hierarchical: HierarchicalDisplay,
    }

    #[derive(Serialize)]
    struct LibraryInfo {
        alphabet_size: usize,
        clusters_per_page: usize,
        pages_per_book: u32,
        books_per_shelf: u32,
        shelves_per_wall: u32,
        walls_per_room: u32,
        total_pages: String,
        address_bits: u64,
    }

    #[derive(Serialize)]
    struct VerifyResponse {
        verified: bool,
        address: String,
        expected_text: String,
        actual_start: String,
    }

    // ============================================================================
    // Helper Functions
    // ============================================================================

    fn make_hierarchical_display(
        library: &LibraryOfBabel,
        location: &Location,
    ) -> HierarchicalDisplay {
        let mandira_kannada = if location.hierarchical.mandira.bits() < 10000 {
            Some(library.mandira_as_kannada(&location.hierarchical.mandira))
        } else {
            None
        };

        HierarchicalDisplay {
            mandira_hex: location.hierarchical.mandira_hex(),
            mandira_kannada,
            gode: location.hierarchical.gode,
            patti: location.hierarchical.patti,
            pustaka: location.hierarchical.pustaka,
            puta: location.hierarchical.puta,
            display_string: location.hierarchical.to_display_string(),
        }
    }

    fn parse_address(address: &str) -> Option<Location> {
        if address.contains('.') {
            HierarchicalAddress::from_display_string(address).map(Location::from_hierarchical)
        } else {
            Location::from_hex(address)
        }
    }

    // ============================================================================
    // Handlers
    // ============================================================================

    async fn health_check(State(state): State<AppState>) -> impl IntoResponse {
        Json(serde_json::json!({
            "status": "ok",
            "name": "ಅಕ್ಷರ ಮಂಟಪ",
            "description": "A Library of Babel for Kannada",
            "alphabet_size": state.library.alphabet_size(),
            "page_length": state.library.page_length(),
        }))
    }

    async fn get_library_info(State(state): State<AppState>) -> impl IntoResponse {
        let alphabet_size = state.library.alphabet_size();

        let total_pages = format!(
            "{}^{} ≈ 10^{}",
            alphabet_size,
            CLUSTERS_PER_PAGE,
            ((CLUSTERS_PER_PAGE as f64) * (alphabet_size as f64).log10()).round() as u64
        );

        let address_bits = ((CLUSTERS_PER_PAGE as f64) * (alphabet_size as f64).log2()).ceil() as u64;

        Json(LibraryInfo {
            alphabet_size,
            clusters_per_page: CLUSTERS_PER_PAGE,
            pages_per_book: PAGES_PER_BOOK,
            books_per_shelf: BOOKS_PER_SHELF,
            shelves_per_wall: SHELVES_PER_WALL,
            walls_per_room: WALLS_PER_ROOM,
            total_pages,
            address_bits,
        })
    }

    async fn get_random_page(State(state): State<AppState>) -> impl IntoResponse {
        let page = state.library.random_page();

        Json(PageResponse {
            raw_address: page.location.raw_hex.clone(),
            hierarchical: make_hierarchical_display(&state.library, &page.location),
            content: page.content,
            formatted_content: page.formatted_content,
        })
    }

    async fn get_page_by_address(
        State(state): State<AppState>,
        Query(query): Query<AddressQuery>,
    ) -> impl IntoResponse {
        let location = match parse_address(&query.address) {
            Some(loc) => loc,
            None => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(serde_json::json!({
                        "error": "Invalid address format. Use hex or 'mandira.gode.patti.pustaka.puta'"
                    })),
                ).into_response();
            }
        };

        let page = state.library.generate_page(&location);

        Json(PageResponse {
            raw_address: page.location.raw_hex.clone(),
            hierarchical: make_hierarchical_display(&state.library, &page.location),
            content: page.content,
            formatted_content: page.formatted_content,
        }).into_response()
    }

    async fn get_next_page(
        State(state): State<AppState>,
        Query(query): Query<AddressQuery>,
    ) -> impl IntoResponse {
        let location = match parse_address(&query.address) {
            Some(loc) => loc,
            None => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(serde_json::json!({
                        "error": "Invalid address format"
                    })),
                ).into_response();
            }
        };

        let page = state.library.next_page(&location);

        Json(PageResponse {
            raw_address: page.location.raw_hex.clone(),
            hierarchical: make_hierarchical_display(&state.library, &page.location),
            content: page.content,
            formatted_content: page.formatted_content,
        }).into_response()
    }

    async fn get_previous_page(
        State(state): State<AppState>,
        Query(query): Query<AddressQuery>,
    ) -> impl IntoResponse {
        let location = match parse_address(&query.address) {
            Some(loc) => loc,
            None => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(serde_json::json!({
                        "error": "Invalid address format"
                    })),
                ).into_response();
            }
        };

        match state.library.previous_page(&location) {
            Some(page) => {
                Json(PageResponse {
                    raw_address: page.location.raw_hex.clone(),
                    hierarchical: make_hierarchical_display(&state.library, &page.location),
                    content: page.content,
                    formatted_content: page.formatted_content,
                }).into_response()
            }
            None => {
                (
                    StatusCode::NOT_FOUND,
                    Json(serde_json::json!({
                        "error": "Already at the first page of the library"
                    })),
                ).into_response()
            }
        }
    }

    async fn search_text(
        State(state): State<AppState>,
        Query(query): Query<SearchQuery>,
    ) -> impl IntoResponse {
        if query.q.is_empty() {
            return (
                StatusCode::BAD_REQUEST,
                Json(SearchResponse {
                    query: query.q,
                    found: false,
                    location: None,
                    page_preview: None,
                }),
            );
        }

        match state.library.search(&query.q) {
            Some(result) => {
                let page = state.library.generate_page(&result.location);
                let preview: String = page.content.chars().take(80).collect();

                (
                    StatusCode::OK,
                    Json(SearchResponse {
                        query: query.q,
                        found: true,
                        location: Some(LocationResponse {
                            raw_address: result.location.raw_hex.clone(),
                            hierarchical: make_hierarchical_display(&state.library, &result.location),
                        }),
                        page_preview: Some(preview),
                    }),
                )
            }
            None => (
                StatusCode::OK,
                Json(SearchResponse {
                    query: query.q,
                    found: false,
                    location: None,
                    page_preview: None,
                }),
            ),
        }
    }

    async fn search_random_position(
        State(state): State<AppState>,
        Query(query): Query<SearchQuery>,
    ) -> impl IntoResponse {
        if query.q.is_empty() {
            return (
                StatusCode::BAD_REQUEST,
                Json(SearchResponse {
                    query: query.q,
                    found: false,
                    location: None,
                    page_preview: None,
                }),
            );
        }

        match state.library.search_at_random_position(&query.q) {
            Some(result) => {
                let page = state.library.generate_page(&result.location);
                let preview: String = page.content.chars().take(80).collect();

                (
                    StatusCode::OK,
                    Json(SearchResponse {
                        query: query.q,
                        found: true,
                        location: Some(LocationResponse {
                            raw_address: result.location.raw_hex.clone(),
                            hierarchical: make_hierarchical_display(&state.library, &result.location),
                        }),
                        page_preview: Some(preview),
                    }),
                )
            }
            None => (
                StatusCode::OK,
                Json(SearchResponse {
                    query: query.q,
                    found: false,
                    location: None,
                    page_preview: None,
                }),
            ),
        }
    }

    async fn verify_text(
        State(state): State<AppState>,
        Query(params): Query<VerifyParams>,
    ) -> impl IntoResponse {
        let location = match parse_address(&params.address) {
            Some(loc) => loc,
            None => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(serde_json::json!({
                        "error": "Invalid address format",
                        "verified": false
                    })),
                ).into_response();
            }
        };

        let page = state.library.generate_page(&location);
        let actual_start: String = page.content
            .chars()
            .take(params.text.chars().count())
            .collect();

        let verified = page.content.starts_with(&params.text);

        Json(VerifyResponse {
            verified,
            address: params.address,
            expected_text: params.text,
            actual_start,
        }).into_response()
    }

    // ============================================================================
    // Main
    // ============================================================================

    #[tokio::main]
    async fn main() {
        println!("Initializing ಅಕ್ಷರ ಮಂಟಪ...");

        let library = Arc::new(LibraryOfBabel::new());
        let state = AppState { library };

        let cors = CorsLayer::new()
            .allow_origin(Any)
            .allow_methods([Method::GET, Method::POST])
            .allow_headers([header::CONTENT_TYPE]);

        let app = Router::new()
            .route("/", get(health_check))
            .route("/api/info", get(get_library_info))
            .route("/api/random", get(get_random_page))
            .route("/api/page", get(get_page_by_address))
            .route("/api/page-next", get(get_next_page))
            .route("/api/page-previous", get(get_previous_page))
            .route("/api/search", get(search_text))
            .route("/api/search-random", get(search_random_position))
            .route("/api/verify", get(verify_text))
            .layer(cors)
            .with_state(state);

        let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
            .await
            .unwrap();

        println!();
        println!("╔══════════════════════════════════════════════════════════════╗");
        println!("║  ಅಕ್ಷರ ಮಂಟಪ | Akshara Mantapa                                ║");
        println!("║  A Library of Babel for Kannada                              ║");
        println!("╠══════════════════════════════════════════════════════════════╣");
        println!("║  Server: http://127.0.0.1:3000                               ║");
        println!("╠══════════════════════════════════════════════════════════════╣");
        println!("║  Endpoints:                                                  ║");
        println!("║    GET /                      Health check                   ║");
        println!("║    GET /api/info              Library statistics             ║");
        println!("║    GET /api/random            Random page                    ║");
        println!("║    GET /api/page              Browse by address              ║");
        println!("║    GET /api/page-next         Next page                      ║");
        println!("║    GET /api/page-previous     Previous page                  ║");
        println!("║    GET /api/search            Find text (at start)           ║");
        println!("║    GET /api/search-random     Find text (random position)    ║");
        println!("║    GET /api/verify            Verify bijection               ║");
        println!("╚══════════════════════════════════════════════════════════════╝");
        println!();

        axum::serve(listener, app).await.unwrap();
    }
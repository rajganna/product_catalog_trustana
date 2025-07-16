export declare const OPTIMIZED_ATTRIBUTE_QUERIES: {
    GET_APPLICABLE_ATTRIBUTES_OPTIMIZED: string;
    GET_ATTRIBUTES_BY_VECTOR_SEARCH: string;
    GET_CATEGORY_DESCENDANTS: string;
    GET_INHERITED_ATTRIBUTES: string;
    COUNT_APPLICABLE_ATTRIBUTES_OPTIMIZED: string;
    COUNT_VECTOR_SEARCH_RESULTS: string;
    GET_GLOBAL_ATTRIBUTES: string;
    GET_ATTRIBUTE_FACETS: string;
    GET_ATTRIBUTE_RECOMMENDATIONS: string;
};
export declare const OPTIMIZED_QUERY_FRAGMENTS: {
    VECTOR_SEARCH_RELEVANCE: string;
    SIMPLE_RELEVANCE_ORDER: string;
    VECTOR_SEARCH_CONDITION: string;
    SIMPLE_SEARCH_CONDITION: string;
    LINK_TYPE_FILTER: string;
};
export declare const OPTIMIZED_QUERY_BUILDER: {
    buildApplicableAttributesQuery: (useVectorSearch: boolean, hasKeyword: boolean, linkTypes?: string[], paramCount?: number) => string;
    buildCountQuery: (useVectorSearch: boolean, hasKeyword: boolean, linkTypes?: string[]) => string;
};
export declare const MATERIALIZED_VIEW_UTILS: {
    REFRESH_ALL_VIEWS: string;
    GET_VIEW_REFRESH_STATUS: string;
    CHECK_VIEW_STALENESS: string;
};

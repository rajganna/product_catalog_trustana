export declare const ATTRIBUTE_QUERIES: {
    GET_APPLICABLE_ATTRIBUTES: string;
    COUNT_DIRECT_ATTRIBUTES: string;
    COUNT_INHERITED_ATTRIBUTES: string;
    COUNT_GLOBAL_ATTRIBUTES: string;
    GET_NOT_APPLICABLE_ATTRIBUTES: string;
    COUNT_NOT_APPLICABLE_ATTRIBUTES: string;
    COUNT_APPLICABLE_ATTRIBUTES: string;
};
export declare const QUERY_FRAGMENTS: {
    SEARCH_CONDITION_WITH_FTS: string;
    SEARCH_CONDITION_SIMPLE: string;
    RELEVANCE_SCORE_WITH_FTS: string;
    RELEVANCE_SCORE_DEFAULT: string;
    KEYWORD_ORDER: string;
    SORT_CASE_NAME: string;
    SORT_CASE_CREATED: string;
    SORT_CASE_UPDATED: string;
};
export declare const QUERY_REPLACEMENTS: {
    buildApplicableAttributesQuery: (linkTypes: string[], hasKeyword: boolean, sortBy: string, sortOrder: string, paramCount: number) => string;
    buildNotApplicableAttributesQuery: (hasKeyword: boolean, sortBy: string, sortOrder: string) => string;
    buildCountQuery: (queryTemplate: string, hasKeyword: boolean) => string;
};

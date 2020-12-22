import gql from "graphql-tag";
export default class GqlBuilder {
    constructor() {
        this.queries = [];
        this.mutations = []
    }
    addQuery({query, variables, label}) {
        let queryString = query.loc.source.body
            .replaceAll(/(\r\n|\n|\r)/gm, "")
            .replace(/(.*?){/, "")
            .slice(0, -1);
    for (let variable in variables) {
        queryString = queryString.replaceAll(
            `$${variable}`,
            typeof variables[variable] === "object" ?
                variables[variable].map(v => {
                    return typeof v === "string" ? `"${v}"` : v
                }).toString()
                : typeof variables[variable] === "string"
                ? `"${variables[variable]}"`
                : variables[variable]
        );
    }

    this.queries.push({
        label: label,
        query: queryString
    });
        return queryString;
    }
    getQueryString() {
        let stringQuery = `query {`;
        for (let query in this.queries) {
            stringQuery += `${this.queries[query].label || 'query' + query}:${this.queries[query].query},`;
        }
        stringQuery += `}`;
        return stringQuery;
    }
    generateQueryRequest() {
        let stringQuery = this.getQueryString();
        return gql`
            ${stringQuery}
        `;
    }
    addMutation({mutation, variables, label}) {
        let mutationString = mutation.loc.source.body.replaceAll('\n', '').replaceAll('\r', '').replace(/(.*?){/, '').slice(0, -1)
        for (let variable in variables) {
            mutationString = mutationString.replaceAll(
                `$${variable}`,
                typeof variables[variable] === "object" ?
                  Array.isArray(variables[variable]) ?
                    variables[variable].map(v => {
                        return typeof v === "string" ? `"${v}"` : v
                    }).toString() :
                    this.formatObject(variables[variable])
                    : typeof variables[variable] === 'string' ? `"${variables[variable]}"` : variables[variable])
        }
        this.mutations.push({
            label: label,
            mutation: mutationString
        });
        return mutationString
    }
    getMutationString() {
        let stringMutation = `mutation {`
        for (let mutation in this.mutations) {
            stringMutation += `${this.mutations[mutation].label || 'mutation' + mutation}:${this.mutations[mutation].mutation},`
        }
        stringMutation += `}`
        return stringMutation
    }
    generateMutationRequest() {
        let stringMutation = this.getMutationString()
        return gql`${stringMutation}`
    }

    formatObject(obj) {
        let objString = '{'
        for (let key in obj) {
            objString += key + ':' + (typeof obj[key] === "string" ? `"${obj[key]}"` : obj[key])
        }
        objString += '}'
        return objString
    }
}

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
        queryString = queryString.replace(
            `/$${variable}/g`,
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
        let variablesTypes = {}
        for (let variable in variables) {
            let varType = mutation.loc.source.body.match(`(\\$${variable}:\\s*)(\\w+)`)[2]
            variablesTypes[variable] = varType
        }
        let mutationString = this.getInsideQueries(mutation.loc.source.body)
        for (let variable in variables) {
            switch (variablesTypes[variable]) {
                case 'String':
                    mutationString = mutationString.replace(`\$${variable}`, `"${variables[variable]}"`)
                    break;
                case 'ID':
                    mutationString = mutationString.replace(`\$${variable}`, `"${variables[variable]}"`)
                    break;
                case '_Neo4jInputDateTime':
                    mutationString = mutationString.replace(`\$${variable}`, this.formatObject(variables[variable]))
                    break;
                default:
                    mutationString = mutationString.replace(`\$${variable}`, variables[variable])
                    break
            }
            // mutationString = mutationString.replace(
            //     `/$${variable}/g`,
            //     typeof variables[variable] === "object" ?
            //       Array.isArray(variables[variable]) ?
            //         variables[variable].map(v => {
            //             return typeof v === "string" ? `"${v}"` : v
            //         }).toString() :
            //         this.formatObject(variables[variable])
            //         : typeof variables[variable] === 'string' ? `"${variables[variable]}"` : variables[variable])
        }
        this.mutations.push({
            label: label,
            mutation: mutationString
        });
        return mutationString
    }
    getMutationString() {
        let stringMutation = `mutation {\n`
        for (let mutation in this.mutations) {
            stringMutation += `${this.mutations[mutation].label || 'mutation' + mutation}:${this.mutations[mutation].mutation},\n`
        }
        stringMutation += `\n}`
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

    reverseString(str) {
        let splitString = str.split("");
        let reverseArray = splitString.reverse();
        let joinArray = reverseArray.join("");
        return joinArray;
    }

    getInsideQueries(gqlFileContent) {
        let mutationString = gqlFileContent
          .match(/{([\S\s]*)/g)[0]
        mutationString = mutationString.replace(/([{\n\r\s]+)/, '')
        mutationString = this.reverseString(this.reverseString(mutationString).replace(/([}\s\n\r]+)/, '')) + ' \n}'
        return mutationString
    }
}

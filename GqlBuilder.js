import gql from "graphql-tag";

export default class GqlBuilder {
  constructor() {
    this.queries = [];
    this.mutations = []
  }

  addQuery({query, variables, label}) {
    let queryString = this.generateQueryString({query, variables})

    this.queries.push({
      label: label,
      query: queryString
    });
    return queryString;
  }

  addMutation({mutation, variables, label}) {
    let mutationString = this.generateQueryString({query: mutation, variables})
    this.mutations.push({
      label: label,
      mutation: mutationString
    });
    return mutationString
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
    mutationString = this.reverseString(this.reverseString(mutationString).replace(/([}\s\n\r]+)/, '')) + ' \n}\n}'
    return mutationString
  }

  generateQueryString({query, variables}) {
    let variablesTypes = {}
    for (let variable in variables) {
      let varType = query.loc.source.body.match(`(\\$${variable}:\\s*)(\\[*\\w+\\]*)`)[2]
      variablesTypes[variable] = varType
    }
    let queryString = this.getInsideQueries(query.loc.source.body)
    for (let variable in variables) {
      if (variablesTypes[variable].substring(0, 1) === '[') {
        let arrayType = variablesTypes[variable].substring(1, variablesTypes[variable].length - 1)
        let generatedArray = '['
        switch (arrayType) {
          case 'String':
            for (let value of variables[variable]) {
              generatedArray += `"${value}",`
            }
            break;
          case 'ID':
            for (let value of variables[variable]) {
              generatedArray += `"${value}",`
            }
            break;
          case '_Neo4jInputDateTime':
            for (let value of variables[variable]) {
              generatedArray += `${this.formatObject(value)},`
            }
            break;
          default:
            for (let value of variables[variable]) {
              generatedArray += `${value},`
            }
        }
        generatedArray = generatedArray.substring(0, generatedArray.length - 1)
        generatedArray += ']'
        queryString = queryString.replace(`\$${variable}`, `${generatedArray}`)
        continue
      }
      switch (variablesTypes[variable]) {
        case 'String':
          queryString = queryString.replace(`\$${variable}`, `"${variables[variable]}"`)
          break;
        case 'ID':
          queryString = queryString.replace(`\$${variable}`, `"${variables[variable]}"`)
          break;
        case '_Neo4jInputDateTime':
          queryString = queryString.replace(`\$${variable}`, this.formatObject(variables[variable]))
          break;
        default:
          queryString = queryString.replace(`\$${variable}`, variables[variable])
          break
      }
    }
    return queryString
  }
}

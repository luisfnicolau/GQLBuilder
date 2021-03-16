import gqlBuilder from './GqlBuilder.js'
import gql from "graphql-tag";

let builder = new gqlBuilder()

builder.addMutation({
  mutation: gql`
      mutation createMutation(
          $id: ID!
          $string:    String
          $number:Int
          $dateString: String
          $dateTimeInput: _Neo4jInputDateTime
          $enum: TaskType!
          $stringArray: [String]
          $intArray: [Int]
          $dateArray: [_Neo4jInputDateTime]
      ) {
          CreateMutation(
              id: $id
              string: $string
              number: $number
              dateString: $dateString
              dateTimeInput: $dateTimeInput
              enum: $enum
              stringArray: $stringArray
              intArray: $intArray
              dateArray: $dateArray
          ) {
              id
              name
              description
              type {
                  deep1
              }
          }
      }
  `,
  variables: {
    id: "1234-1234",
    string: "Uma string",
    number: 42,
    stringArray: ["a", "b", "c"],
    intArray: [1, 2, 3],
    dateString: "2021-01-31T00:00:00",
    dateTimeInput: {
      formatted: "2021-01-3100:00:00"
    },
    dateArray: [
      {
        formatted: "2021-01-3100:00:00"
      },
      {
        formatted: "2021-01-3100:00:00"
      },
      {
        formatted: "2021-01-3100:00:00"
      }
    ],
    enum: "MyEnum"
  }
})

builder.addMutation({
  mutation: gql`
      mutation createMutation(
          $id: ID!
          $string:    String
      ) {
          CreateMutation(
              id: $id
              string: $string
          ) {
              id
          }
      }
  `,
  variables: {
    id: "1234-1234",
    string: "Uma string",
  }
})

console.log(builder.generateMutationRequest().loc.source.body)

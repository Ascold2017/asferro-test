import gql from 'graphql-tag'

export const GET_POSTS_QUERY = gql`query posts($options: PageQueryOptions) {
  posts(options: $options) {
    data {
      id
      title
      body
    }
    meta {
      totalCount
    }
  }
}`

export const CREATE_POST_QUERY = gql`mutation addPost ($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    body
  }
}`

export const UPDATE_POST_QUERY = gql`mutation updatePost($id: ID!, $input: UpdatePostInput!) {
  updatePost(id: $id, input: $input) {
    id
    title
    body
  }
}`

export const DELETE_POST_QUERY = gql`mutation deletePost($id: ID!) {
  deletePost(id: $id)
}`
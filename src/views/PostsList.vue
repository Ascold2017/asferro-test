<template>
  <v-container>
    <v-data-table
      :loading="$apollo.queries.posts.loading"
      :headers="tableHeaders"
      :items="postsList"
      :items-per-page="limit"
      :page.sync="page"
      hide-default-footer>
      
      <template v-slot:top>
        <v-toolbar flat color="white">
          <v-toolbar-title>Посты</v-toolbar-title>
          <v-divider
            class="mx-4"
            inset
            vertical
          ></v-divider>
          <v-spacer></v-spacer>
          
          <v-dialog v-model="dialog" max-width="500px">
            <template v-slot:activator="{ on }">
              <v-btn color="primary" dark class="mb-2" v-on="on">Новый пост</v-btn>
            </template>
            <v-card>
              <v-card-title>
                <span class="headline">{{ formTitle }}</span>
              </v-card-title>

              <v-card-text>
                <v-text-field v-model="editedPost.title" label="Заголовок"></v-text-field>
                <v-textarea v-model="editedPost.body" label="Содержимое"></v-textarea>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="closeDialog">Отменить</v-btn>
                <v-btn color="blue darken-1" text @click="savePost">Сохранить</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn icon class="mr-2" @click="editPost(item)" color="info">
          <v-icon>
            mdi-pencil
          </v-icon>
        </v-btn>
        <v-btn icon @click="deletePost(item.id)" color="error">
          <v-icon>
            mdi-delete
          </v-icon>
        </v-btn>
      </template>
    </v-data-table>
    <v-pagination
      :value="page"
      @input="changePage"
      :length="postsPagesCount"
      :total-visible="10"
      :disabled="$apollo.queries.posts.loading">
    </v-pagination>
  </v-container>
  
</template>

<script>
import gql from 'graphql-tag'
import _get from 'lodash.get'
const GET_POSTS_QUERY = gql`query posts($options: PageQueryOptions) {
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
}`;
const CREATE_POST_QUERY = gql`mutation addPost ($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    body
  }
}`

const UPDATE_POST_QUERY = gql`mutation updatePost($id: ID!, $input: UpdatePostInput!) {
  updatePost(id: $id, input: $input) {
    id
    title
    body
  }
}`

const DELETE_POST_QUERY = gql`mutation deletePost($id: ID!) {
  deletePost(id: $id)
}`

export default {
  data () {
    return {
      dialog: false,
      tableHeaders: [
        { text: 'ID', value: 'id', sortable: false },
        { text: 'Заголовок', value: 'title', sortable: false },
        { text: 'Действия', value: 'actions', sortable: false },
      ],
      page: 1,
      limit: 15,

      editedIndex: -1,
      editedPost: {
        title: '',
        body: ''
      },
    }
  },
  apollo: {
    posts() {
      return {
        query: GET_POSTS_QUERY,
        variables: {
          options: {
            paginate: {
              page: this.page,
              limit: this.limit
            }
          }
        },
        loadingKey: 'postsListLoading'
      }
    }
  },
  computed: {
    postsList() {
      return this.$apollo.loading ? [] : _get(this.posts, 'data', [])
    },
    postsTotalCount() {
      return this.$apollo.loading ? 0 : +_get(this.posts, 'meta.totalCount', 0)
    },
    postsPagesCount() {
      return Math.round(this.postsTotalCount / this.limit)
    },
    formTitle() {
      return this.editedIndex === -1 ? 'Новый пост' : 'Реактируемый пост'
    }
  },
  methods: {
    changePage(value) {
      if (value !== this.page) {
        this.page = value

        this.$apollo.queries.posts.fetchMore({
          variables: {
            options: {
              paginate: {
                page: this.page,
                limit: this.limit
              }
            }
          },
          // Mutate the previous result
          updateQuery: (previousResult, { fetchMoreResult }) => fetchMoreResult,
        });
      }
    },
    closeDialog() {
      this.dialog = false
      this.resetEditedPost()
    },
    resetEditedPost() {
      this.editedPost.title = ''
      this.editedPost.body = ''
      this.editedIndex = -1
    },
    editPost(post) {
      this.editedIndex = _get(post, 'id', null)
      this.editedPost.title = _get(post, 'title', '')
      this.editedPost.body = _get(post, 'body', '')
      this.dialog = true
    },
    savePost() {
      this.editedIndex === -1 ? this.addPost() : this.updatePost()
    },
    onNewPostRecieved(previousResult, { mutationResult }) {
      this.closeDialog()
      const prevPosts = _get(previousResult, 'posts.data', [])
      const createdPost = _get(mutationResult, 'data.createPost', {})
      const prevMeta = _get(previousResult, 'posts.meta', {})
      const prevTotalCount = +_get(prevMeta, 'totalCount', 0)
      
      if (
        prevPosts.find(post => post.id === createdPost.id) ||
        this.page !== this.postsPagesCount
      ) return previousResult

      return {
        posts: {
          ...previousResult.posts,
          data: [
            ...prevPosts,
            createdPost
          ],
          meta: {
            ...prevMeta,
            totalCount: prevTotalCount + 1
          },
        }
      };
    },
    onUpdatePostRecieved(previousResult, { mutationResult }) {
      console.log(111)
      this.closeDialog()
      const prevPosts = _get(previousResult, 'posts.data', [])
      const updatedPost = _get(mutationResult, 'data.updatePost', {})
      return {
        posts: {
          ...previousResult.posts,
          data: [
            ...prevPosts.map(post => {
              if (post.id === updatedPost.id) {
                return {
                  ...post,
                  ...updatedPost
                }
              }
              return post
            })
          ]
        }
      };
    },
    onDeletePostRecieved(postToDeleteId, previousResult, { mutationResult }) {
      const isDeleted = !!_get(mutationResult, 'data.deletePost', false)
      const prevPosts = _get(previousResult, 'posts.data', [])
      const prevMeta = _get(previousResult, 'posts.meta', {})
      const prevTotalCount = +_get(prevMeta, 'totalCount', 0)
      if (isDeleted) {
        return {
          posts: {
            ...previousResult.posts,
            data: prevPosts.filter(post => post.id !== postToDeleteId),
            meta: {
              ...prevMeta,
              totalCount: prevTotalCount -1
            }
          }
        }
      }
      return previousResult
    },
    addPost() {
      this.$apollo.mutate({
        mutation: CREATE_POST_QUERY,
        variables: {
          input: {
            title: this.editedPost.title,
            body: this.editedPost.body
          }
        },
        updateQueries: {
          posts: this.onNewPostRecieved
        }
      })
    },
    updatePost() {
      this.$apollo.mutate({
        mutation: UPDATE_POST_QUERY,
        variables: {
          id: this.editedIndex,
          input: {
            title: this.editedPost.title,
            body: this.editedPost.body
          }
        },
        updateQueries: { posts: this.onUpdatePostRecieved }
      })
    },
    deletePost(postToDeleteId) {
      this.$apollo.mutate({
        mutation: DELETE_POST_QUERY,
        variables: {
          id: postToDeleteId,
        },
        updateQueries: {
          posts: this.onDeletePostRecieved.bind(this, postToDeleteId)
        }
      })
    }
  }
}
</script>

<style>

</style>
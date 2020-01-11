import Vue from 'vue'
import Vuex from 'vuex'
import _get from 'lodash.get'
import { apolloClient } from '@/helpers/apolloClient'
import { GET_POSTS_QUERY, CREATE_POST_QUERY, UPDATE_POST_QUERY, DELETE_POST_QUERY } from './queries'
import createCache from 'vuex-cache'
Vue.use(Vuex)

export default new Vuex.Store({
  plugins: [createCache()],
  state: {
    page: 1,
    limit: 15,
    posts: [],
    count: 0,

    editedIndex: -1,
    postTitle: '',
    postBody: '',
    loading: false
  },
  getters: {
    pagesCount: ({ count, limit }) => Math.round(count / limit)
  },
  mutations: {
    SET_LOADING: (state, value) => {
      state.loading = value
    },
    SET_POSTS: (state, data) => {
      state.posts = [..._get(data, 'posts.data', [])]
      state.count = +_get(data, 'posts.meta.totalCount', 0)
    },
    APPEND_POST: (state, data) => {
      state.count++
      state.posts = [...state.posts, data]
    },
    REPLACE_POST: (state, data) => {
      state.posts = state.posts.map(post => post.id === data.id ? data : post)
    },
    REMOVE_POST: (state, postId) => {
      state.count--
      state.posts = state.posts.filter(post => post.id !== postId)
    },
    SET_PAGE: (state, value) => {
      state.page = value
    },
    SET_POST_TITLE: (state, value) => {
      state.postTitle = value
    },
    EDIT_POST: (state, postId) => {
      const post = JSON.parse(JSON.stringify(state.posts.find(post => post.id === postId)))
      state.editedIndex = postId
      state.postTitle = post.title
      state.postBody = post.body
    },
    SET_POST_BODY: (state, value) => {
      state.postBody = value
    },
    SET_TO_ZERO_POSTS: (state) => {
      state.posts = []
      state.count = 0
      state.page = 1
    },
    SET_TO_ZERO_POST: (state) => {
      state.editedIndex = -1
      state.postTitle = ''
      state.postBody = ''
    }
  },
  actions: {
    async loadPage({ commit, dispatch }, page) {
      commit('SET_PAGE', page)
      await dispatch('getPosts')
    },
    async getPosts({ state, commit }) {
      commit('SET_LOADING', true)
      await apolloClient.query({
        query: GET_POSTS_QUERY,
        variables: {
          options: {
            paginate: {
              page: state.page,
              limit: state.limit
            }
          }
        },
      })
      .then(({ data }) => commit('SET_POSTS', data))
      .finally(() => commit('SET_LOADING', false))
    },
    async createPost({ state, getters, commit }) {
      commit('SET_LOADING', true)
      await apolloClient.mutate({
        mutation: CREATE_POST_QUERY,
        variables: {
          input: {
            title: state.postTitle,
            body: state.postBody
          }
        },
      })
      .then(({ data }) => {
        const post = _get(data, 'createPost', false)
        post && state.page === getters.pagesCount && commit('APPEND_POST', post)
      })
      .finally(() => commit('SET_LOADING', false))
    },
    async patchPost({ state, commit }) {
      commit('SET_LOADING', true)
      await apolloClient.mutate({
        mutation: UPDATE_POST_QUERY,
        variables: {
          id: state.editedIndex,
          input: {
            title: state.postTitle,
            body: state.postBody
          }
        },
      })
      .then(({ data }) => {
        const post = _get(data, 'updatePost', false)
        post && commit('REPLACE_POST', post)
      })
      .finally(() => commit('SET_LOADING', false))
    },

    async deletePost({ commit }, postId) {
      commit('SET_LOADING', true)
      await apolloClient.mutate({
        mutation: DELETE_POST_QUERY,
        variables: {
          id: postId,
        },
      })
      .then(({ data }) => {
        const isDeleted = _get(data, 'deletePost', false)
        isDeleted && commit('REMOVE_POST', postId)
      })
      .finally(() => commit('SET_LOADING', false))
    }
  },
})

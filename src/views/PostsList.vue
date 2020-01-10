<template>
  <v-container>
    <v-data-table
      :loading="loading"
      :headers="tableHeaders"
      :items="posts"
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
                <v-text-field v-model="vTitle" label="Заголовок"></v-text-field>
                <v-textarea v-model="vBody" label="Содержимое"></v-textarea>
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
        <v-btn icon class="mr-2" @click="editPost(item.id)" color="info">
          <v-icon>
            mdi-pencil
          </v-icon>
        </v-btn>
        <v-btn icon @click="removePost(item.id)" color="error">
          <v-icon>
            mdi-delete
          </v-icon>
        </v-btn>
      </template>
    </v-data-table>
    <v-pagination
      :value="page"
      @input="changePage"
      :length="pagesCount"
      :disabled="loading">
    </v-pagination>
  </v-container>
  
</template>

<script>
import { mapState, mapActions, mapMutations, mapGetters } from 'vuex'
export default {
  data () {
    return {
      dialog: false,
      tableHeaders: [
        { text: 'ID', value: 'id', sortable: false },
        { text: 'Заголовок', value: 'title', sortable: false },
        { text: 'Действия', value: 'actions', sortable: false },
      ]
    }
  },
  created() {
    this.getPosts().catch(console.error)
  },
  destroyed() {
    this['SET_TO_ZERO_POSTS']()
    this['SET_TO_ZERO_POST']()
  },
  computed: {
    ...mapState([
      'posts',
      'loading',
      'page',
      'limit',
      'count',
      'editedIndex',
      'postTitle',
      'postBody'
    ]),
    ...mapGetters(['pagesCount']),
    formTitle() {
      return this.editedIndex === -1 ? 'Новый пост' : 'Реактируемый пост'
    },
    vTitle: {
      get() {
        return this.postTitle
      },
      set(value) {
        this['SET_POST_TITLE'](value)
      }
    },
    vBody: {
      get() {
        return this.postBody
      },
      set(value) {
        this['SET_POST_BODY'](value)
      }
    }
  },
  methods: {
    ...mapActions(['getPosts', 'loadPage', 'createPost', 'patchPost', 'deletePost']),
    ...mapMutations([
      'SET_POST_TITLE',
      'SET_POST_BODY',
      'SET_TO_ZERO_POST',
      'SET_TO_ZERO_POSTS',
      'EDIT_POST'
    ]),
    changePage(value) {
      if (value !== this.page) {
        this.loadPage(value)
      }
    },
    closeDialog() {
      this.dialog = false
      this['SET_TO_ZERO_POST']()
    },
    editPost(postId) {
      this['EDIT_POST'](postId)
      this.dialog = true
    },
    savePost() {
      this.editedIndex === -1 ? this.addPost() : this.updatePost()
    },
    addPost() {
      this.createPost().catch(console.error)
    },
    updatePost() {
      this.patchPost().catch(console.error)
    },
    removePost(postId) {
      this.deletePost(postId).catch(console.error)
    }
  }
}
</script>

<style>

</style>
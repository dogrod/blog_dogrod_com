import * as React from 'react'
import Immutable from 'immutable'
import classNames from 'classnames'
import { RouteComponentProps, Link } from 'react-router-dom'

import Icon from '@/components/icon'
import Toast from '@/components/toast';
import Loading from '@/components/loading'
import Comments from '@/pages/post/_components/comment'
import AnimatedCard from '@/pages/post/_components/animated-card'

import api from '@/api'
import http from '@/utils/http'
import marked from '@/utils/marked'
import { convertTimeFormat, setTitle } from '@/utils'
import { REG_EXTRACT_ID_FROM_MIXED_SLUG } from '@/utils/regs'
import { UserConsumer } from '@/context/user'

import BlogTypes from '@/types/blog'
import { ImmutableMap } from '@/types/vendor'

import './index.scss'

type PostType = ImmutableMap<BlogTypes.Post>

interface PropTypes extends RouteComponentProps<{ slug: string }> {}

interface StateTypes {
  id: string
  post?: PostType
  comments: Immutable.List<BlogTypes.Comment>

  isLoading: boolean
  disableLike: boolean
  activeLike: boolean
  successLike: boolean
}

const PREFIX_CLASS = 'post-detail'
const CACHE_KEY = 'DRCacheSuccessLike'

class PostDetail extends React.Component<PropTypes, StateTypes> {
  constructor(props: PropTypes) {
    super(props)

    const match = props.match.params.slug.match(REG_EXTRACT_ID_FROM_MIXED_SLUG)

    this.state = {
      id: match ? match[0] : '',
      comments: Immutable.List(),
      isLoading: false,
      disableLike: false,
      activeLike: false,
      successLike: false,
    }
  }

  async componentDidMount() {
    this.initPost()
    this.initComments()
  }

  /**
   * Process post related init actions, exclude fetch comments
   */
  initPost = async () => {
    this.setLoadingStatus(true)

    try {
      const post: BlogTypes.Post = await this.fetchPostDetailData()

      setTitle(post.title)

      this.setState({
        post: Immutable.Map(post)
      })

      const localCache = window.localStorage.getItem(CACHE_KEY)
      if (localCache) {
        const cacheObject = JSON.parse(localCache)
        this.setSuccessLike(cacheObject[this.state.id] === '1')
      }
    } catch (error) {
      Toast.show(error.message)
    } finally {
      this.setLoadingStatus(false)
    }
  }

  /**
   * Init comments
   */
  initComments = async () => {
    try {
      const comments: BlogTypes.Comment[] = await this.fetchComments()

      this.setState({
        comments: this.state.comments.merge(comments)
      })
    } catch (error) {
      Toast.show(error.message)
    }
  }

  /**
   * click like button event
   */
  handleClickLike = async () => {
    const { id, disableLike} = this.state

    if (disableLike) {
      return
    }

    const url = `${api.getPosts}/${id}/like`
    const data = {
      increment: 1,
    }

    this.setDisableLike(true)

    try {
      const result: any = await http.post(url, data)

      const likeCount = result.likes

      this.setLikeCount(likeCount)

      await this.triggerLikeSuccess()

      this.setSuccessLike(true)
      this.cacheSuccessLikeStatus(id)
    } catch (error) {
      Toast.show(error.message)
    } finally {
      this.setDisableLike(false)
    }
  }

  handleSubmitNewComment = async (content: string) => {
    const { id } = this.state
    const url = `${api.getPosts}/${id}/comments`
    const data = { content }

    try {
      const response: any = await http.post(url, data)
      
      this.setCommentCount(response.comments)
      this.unshiftComment(response.detail)
      
      Toast.show('评论成功！')
    } catch (error) {
      Toast.show(error.message)
    }
  }

  /**
   * fetch post detail data
   * @returns promise instance
   */
  fetchPostDetailData = async () => {
    const { id } = this.state
    const url = `${api.getPosts}/${id}`
    
    try {
      const response: any = await http.get(url)

      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Fetch comments data
   */
  fetchComments = async () => {
    const { id } = this.state
    const url = `${api.getPosts}/${id}/comments`
    
    try {
      const response: any = await http.get(url)

      return response.list
    } catch (error) {
      throw error
    }
  }

  /**
   * set loading status
   * @param isLoading - loading status
   */
  setLoadingStatus = (isLoading: boolean) => {
    this.setState({ isLoading })
  }

  /**
   * set disable like
   * @param disableLike - disable like
   */
  setDisableLike = (disableLike: boolean) => {
    this.setState({ disableLike })
  }

  /**
   * set like count of post
   * @param likes - likes of post
   */
  setLikeCount = (likes: number) => {
    if (!this.state.post) {
      return
    }

    const newState = {
      post: this.state.post.set('likes', likes)
    }

    this.setState(newState)
  }

  /**
   * set comment count of post
   * @param comments - comments of post
   */
  setCommentCount = (comments: number) => {
    if (!this.state.post) {
      return
    }

    const newState = {
      post: this.state.post.set('comments', comments)
    }

    this.setState(newState)
  }

  /**
   * Set success like
   * @param successLike - success like status
   */
  setSuccessLike = (successLike: boolean) => {
    this.setState({ successLike })
  }

  /**
   * Unshift new comment to comment list
   * @param comment - new comment
   */
  unshiftComment = (comment: BlogTypes.Comment) => {
    const newState = {
      comments: this.state.comments.unshift(comment)
    }

    this.setState(newState)
  }

  /**
   * Trigger like success status after like action succeed
   */
  triggerLikeSuccess = async () => {
    this.setState({
      activeLike: true,
    })

    const promise = new Promise((resolve) => window.setTimeout(
      () => {
        this.setState({ activeLike: false })

        return resolve()
      },
      300
    ))

    return promise
  }

  /**
   * Cache success like status in local storage
   * @param id - post id
   */
  cacheSuccessLikeStatus = (id: string) => {
    const cacheObjectString = window.localStorage.getItem(CACHE_KEY)
    const cacheObject = cacheObjectString ? JSON.parse(cacheObjectString) : {}

    const newCacheObject =  {...cacheObject, ...{ [id]: '1' }}
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(newCacheObject))
  }

  /**
   * Convert markdown string to html string
   * @param content - markdown string
   * @returns html string
   */
  convertMarkdownContent = (content: string) => marked(content)

  /**
   * Render post
   * @param postData - Post Map
   * @returns JSX Elements
   */
  renderPost = (postData: PostType) => {
    const renderMarkedContent = () => (
      <div
        className={`${PREFIX_CLASS}__content markdown`}
        dangerouslySetInnerHTML={{
          __html: this.convertMarkdownContent(postData.get('content') || '')
        }}
      />
    )

    const renderTags = () => (
      <div className={`${PREFIX_CLASS}__tags`}>
        {
          postData.get('tags').map((tag) => 
            <Link
              key={tag.id}
              className={`${PREFIX_CLASS}__tag`}
              to={`/?tag=${tag.name}-${tag.id}`}
            >
              {tag.name}
            </Link>
          )
        }
      </div>
    )

    const renderBottomInfo = () => (
      <div className={`${PREFIX_CLASS}__bottom-info`}>
        <div className={`${PREFIX_CLASS}__publish-time`}>
          发布于{convertTimeFormat(postData.get('publishAt'))}
        </div>
        <div className={`${PREFIX_CLASS}__actions`}>
          <div
            className={classNames(
              `${PREFIX_CLASS}__likes-summary`,
              {
                [`${PREFIX_CLASS}__action--active`]: this.state.activeLike,
                [`${PREFIX_CLASS}__action--highlight`]: this.state.successLike,
              },
            )}
            onClick={() => this.handleClickLike()}
          >
            <div className={`${PREFIX_CLASS}__action-icon`}>
              <Icon name="like-simple" />
            </div>
            <div className={`${PREFIX_CLASS}__action-count`}>
              {postData.get('likes')}
            </div>
          </div>
          <div className={`${PREFIX_CLASS}__comments-summary`}>
            <div className={`${PREFIX_CLASS}__action-icon`}>
              <Icon name="comment" />
            </div>
            <div className={`${PREFIX_CLASS}__action-count`}>
              {postData.get('comments')}
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <AnimatedCard
        className={PREFIX_CLASS}
      >
        <h1 className={`${PREFIX_CLASS}__title`}>{postData.get('title')}</h1>
        <div className={`${PREFIX_CLASS}__category`}>{postData.getIn(['category', 'title'])}</div>
        {renderMarkedContent()}
        {renderTags()}
        {renderBottomInfo()}
      </AnimatedCard>
    )
  }

  /**
   * Render comment module
   */
  renderComment = () => {
    return (
      <UserConsumer>
        {(({ isLoggedIn }) => (
          <Comments
            isLogged={isLoggedIn}
            comments={this.state.comments}
            onSubmit={this.handleSubmitNewComment}
          />
        ))}
      </UserConsumer>
    )
  }

  /**
   * Render page with content
   * @param post - Post Map
   */
  renderPage = (post: PostType) => {
    return (
      <div
        className={`${PREFIX_CLASS}__wrapper`}
        style={{
          backgroundImage: `url(${post.get('coverImage')})`,
        }}
      >
        {this.renderPost(post)}
        {this.renderComment()}
      </div>
    )
  }

  render() {
    const { post, isLoading } = this.state
    
    return isLoading
          ? <Loading />
          : post ? this.renderPage(post) : null
  }
}

export default PostDetail

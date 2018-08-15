import * as React from 'react'
// import { AxiosResponse } from 'axios'
import { Link } from 'react-router-dom'

// import { PostListResponse } from '@/types/api'
import BlogTypes from '@/types/blog'

import http from '@/utils/http'
import api from '@/api'
import { convertTimeFormat, setTitle } from '@/utils'

import List from '@/components/list'
import ListItem from '@/components/list/item'
import Card from '@/components/card'
import Loading from '@/components/loading'

import './index.scss'

interface StateTypes {
  list: BlogTypes.Post[],
  isLoading: boolean,
  page: number
  pageSize: number
  tag: string | null
}

const PREFIX_CLASS = 'post-list'

class PostList extends React.Component<{}, StateTypes> {
  constructor(props: {}) {
    super(props)

    this.state = {
      list: [],
      isLoading: false,
      page: 0,
      pageSize: 15,
      tag: null,
    }
  }

  async componentDidMount() {
    setTitle('无敌筋斗雷 x 不唠嗑')

    try {
      const list = await this.fetchPostListData()

      this.setState({
        list
      })
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * fetch post list data
   * @returns promise instance
   */
  fetchPostListData = async () => {
    const { page, pageSize, tag } = this.state
    
    const url = api.getPosts
    const params = {
      page: page + 1,
      pageSize,
      tag,
    }

    // Start loading status
    this.setLoadingStatus(true)
    
    try {
      // FIXME: Fix conflict between axios response & axios response interceptors
      const response: any = await http.get(url, { params })

      return response.posts
    } catch (error) {
      throw error
    } finally {
      // End loading status
      this.setLoadingStatus(false)
    }
  }

  /**
   * set loading status
   * @param isLoading - loading status
   */
  setLoadingStatus(isLoading: boolean) {
    this.setState({ isLoading })
  }

  /**
   * render post content inside <Card></Card>
   * @param item - post item
   */
  renderPostContent = (item: BlogTypes.Post) => {
    const url = `/post/${item.slug}`

    return (
      <div className={`${PREFIX_CLASS}__item`}>
        <div className={`${PREFIX_CLASS}__publish-time`}>
          {convertTimeFormat(item.publishAt)}
        </div>
        <div className={`${PREFIX_CLASS}__description`}>
          <div className={`${PREFIX_CLASS}__title`}>
            <Link to={url}>
              {item.title}
            </Link>
          </div>
          <p
            className={`${PREFIX_CLASS}__content`}
            dangerouslySetInnerHTML={{__html: item.content}}
          />
          <p className={`${PREFIX_CLASS}__read-more`}>
            <Link to={url}>
              查看全文
            </Link>
          </p>
        </div>
      </div>
    )
  }

  /**
   * render post list
   * @param list - post list data
   */
  renderList = (list: BlogTypes.Post[]) => {
    const { renderPostContent } = this
    return list.map((item) => {
      return (
        <ListItem key={item.id}>
          <Card>
            {renderPostContent(item)}
          </Card>
        </ListItem>
      )
    })
  }

  render() {
    const { state } = this
    const { list, isLoading } = state

    return (
      <div className={PREFIX_CLASS}>
        <List>
          {this.renderList(list)}
        </List>
        {
          isLoading
            ? <Loading follow={true} />
            : null
        }
      </div>
    )
  }
}

export default PostList

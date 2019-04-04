import React, { useCallback, useEffect } from 'react'
import { useDispatch, useMappedState, useModel, useReactEffect } from '@symph/joy/hook'
import HooksModel from './HooksModel'

export default function Hooks (props) {

  const [hooksModel] = useModel([HooksModel])
  const dispatch = useDispatch()

  // Declare your memoized mapState function
  const mapState = useCallback(
    (state) => {                // state is store's state
      return {
        count: state.hooks.count,  // bind model's state to props
      }
    },
    [],
  )

  // Get data from and subscribe to the store
  let {count} = useMappedState(mapState)

  // call on server when ssr on, or browser
  useEffect(() => {
    hooksModel.add({num: 1})
  }, [])

  // called on browser, on load
  useReactEffect(() => {
    hooksModel.add({num: 1})
  }, [])

  return (
    <div>
      <div id={'hooksModel'}>hooksModel.namespace:{hooksModel.namespace}</div>
      <div id={'count'}>count:{count}</div>
      <div id={'btnAdd'} onClick={()=> hooksModel.add({num:1})}>btnAdd</div>
      <div id={'btnAddByDispatch'} onClick={()=> dispatch({type: 'hooks/add', num:1})}>btnAddByDispatch</div>
    </div>
  )
}

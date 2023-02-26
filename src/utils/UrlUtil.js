export default class UrlUtil {
  url = null;
  searchParam = {};
  pathname = [];
  constructor(url) {
    this.url = url;
    this.analyzeSearchParam();
  }
  analyzeSearchParam() {
    let { search, pathname } = this.url;
    this.pathname = pathname.split('/').filter(path => !!path);
    search = decodeURI(search);
    if (search) {
      search = search.replace(/\?/, '"');
      search = search.replace(/=/g, '":"');
      search = search.replace(/&/g, '","');
      this.searchParam = JSON.parse(`{${search}"}`);
    }
  }
}

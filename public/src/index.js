const socket = io();


class AppCtrl {
    constructor($scope) {
        this.tokens = [];
        this.accounts = []
        this.blockExplorer = '';

        this.totalOrders = 0;
        this.totalProfit =0;
        this.last24HOrders = 0;
        this.last24HProfit = 0;

        this.$scope = $scope;
        this.start();
    }

    static get $inject() {
        return ['$scope'];
    }

    start() {
        this.getAddresses();
        this.getNetworkData();
        this.getTotals(); // fire only once
        this.getLast24HTotals();

        setInterval(() => {
            this.getAddresses();
            this.getLast24HTotals();
        }, 15000);
    }

    getAddresses() {
        let p=this;

        socket.emit("getAddresses", (res) => {
            console.log("response addresses:", res);
            p.accounts = res || [];
            p.totalUsdBalance = 0;
            p.tokens = p.accounts[0].tokenBalances.map(balance => balance.token);
            p.accounts.forEach(acc => p.totalUsdBalance += Number(acc.usdBalance))
            p.$scope.$applyAsync();
        });
    }

    getNetworkData() {
        let p=this;

        socket.emit("getNetworkData", (res) => {
            console.log("network data:", res);

            p.blockExplorer = res.blockExplorer;

            p.$scope.$applyAsync();
        })
    }

    getTotals() {
        let p=this;

        socket.emit("getTotals", (res) => {
            console.log("response totals:", res);
            p.totalOrders = res.totalActionsNumber;
            p.totalProfit = res.profit;
            p.$scope.$applyAsync();
        })
    }

    getLast24HTotals() {
        let p=this;

        socket.emit("getLast24HTotals", (res) => {
            console.log("response last 24h totals:", res);

            p.last24HOrders = res.totalActionsNumber;
            p.last24HProfit = res.profit;
            p.$scope.$applyAsync();
        })
    }
}

class OrderBookCtrl {
    constructor($scope) {
        this.orders = {
            spot: {
                list: [],
                status: "",
                pair: "",
                pairs: [],
                page: 1,
                limit: 100,
                total: 0,
            },
            margin: {
                list: [],
                status: "",
                pair: "",
                pairs: [],
                page: 1,
                limit: 100,
                total: 0,
            }
        };
        this.volumes = {
            spot: null,
            margin: null,
        };
        this.totalVolumes = {
            spot: null,
            margin: null,
        };

        this.$scope = $scope;
        this.changeTab('spot');
        this.getNetworkData();
    }

    static get $inject() {
        return ['$scope'];
    }

    getNetworkData() {
        let p = this;

        socket.emit("getNetworkData", (res) => {
            p.blockExplorer = res.blockExplorer;

            p.$scope.$applyAsync();
        })
    }

    listOrders(type, resetPage) {
        const p = this;
        const tableData = this.orders[type];
        const page = resetPage ? 0 : tableData.page;
        const offset = (page - 1) * tableData.limit;
        const filter = {
            type: type,
            offset: offset,
            limit: tableData.limit,
            status: tableData.status,
            pair: tableData.pair,
        };
        socket.emit('listOrders', filter, (result) => {
            console.log(result);
            tableData.list = result.list;
            tableData.total = result.total;
            tableData.page = Math.floor(result.offset / result.limit) + 1;
            p.$scope.$applyAsync();
        });

        if (tableData.pair) {
            this.getVolume(type, tableData.pair);
        } else {
            this.volumes = { spot: null, margin: null };
        }
    }

    listPairs(type) {
        const p = this;
        socket.emit('listPairs', type, (pairs) => {
            p.orders[type].pairs = pairs || [];
            p.$scope.$applyAsync();
        });
    }

    changeTab(type) {
        this.listOrders(type, true);
        this.listPairs(type);
        this.getTotalVolumes(type);
    }

    copy(text) {
        if (!navigator.clipboard) {
            setTimeout(() => {
                var textArea = document.createElement("textarea");
                textArea.value = text;

                // Avoid scrolling to bottom
                textArea.style.top = "0";
                textArea.style.left = "0";
                textArea.style.position = "fixed";

                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Fallback: Oops, unable to copy', err);
                }

                document.body.removeChild(textArea);
            }, 10);
        } else {
            navigator.clipboard.writeText(text);
        }
    }

    short(text) {
        return text.substr(0, 4) + '...' + text.substr(text.length - 4);
    }

    getPairName(pair) {
        return pair.replace('WRBTC', 'rBTC');
    }

    getVolume(type, pair) {
        const p = this;
        socket.emit('sumVolPair', type, pair, (sumVol) => {
            p.volumes[type] = sumVol;
            p.$scope.$applyAsync();
        });
    }

    getTotalVolumes(type) {
        const p = this;
        socket.emit('totalVolumes', type, (sumVol) => {
            p.totalVolumes[type] = sumVol;
            p.$scope.$applyAsync();
        });
    }
}

angular.module('app', ['ui.bootstrap'])
    .controller('appCtrl', AppCtrl)
    .controller('orderBookCtrl', OrderBookCtrl);

angular.bootstrap(document, ['app']);

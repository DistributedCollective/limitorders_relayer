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
        this.orderDetail = null;
        this.marginOrderDetail = null;
        // this.orders = {
        //     spot: {
        //         list: [],
        //         status: "",
        //         page: 1,
        //         limit: 10,
        //         total: 0,
        //     },
        //     margin: {
        //         list: [],
        //         status: "",
        //         page: 1,
        //         limit: 10,
        //         total: 0,
        //     }
        // };

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

    viewOrder() {
        const p = this;
        this.orderDetail = null;
        this.marginOrderDetail = null;
        const hash = prompt("Enter order hash:");
        socket.emit("getOrderDetail", hash, false, (res) => {
            console.log("response order detail", res);
            if (res.error) alert(res.error);
            else {
                p.orderDetail = res;
                p.orderDetail.hash = hash;
                p.$scope.$applyAsync();
            }
        });
    }

    viewMarginOrder() {
        const p = this;
        this.orderDetail = null;
        this.marginOrderDetail = null;
        const hash = prompt("Enter order hash:");
        socket.emit("getOrderDetail", hash, true, (res) => {
            console.log("response order detail", res);
            if (res.error) alert(res.error);
            else {
                p.marginOrderDetail = res;
                p.marginOrderDetail.hash = hash;
                p.$scope.$applyAsync();
            }
        });
    }
}

class OrderBookCtrl {
    constructor($scope) {
        this.orders = {
            spot: {
                list: [],
                status: "",
                page: 1,
                limit: 100,
                total: 0,
            },
            margin: {
                list: [],
                status: "",
                page: 1,
                limit: 100,
                total: 0,
            }
        };

        this.$scope = $scope;
        this.listOrders('spot');
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
            type: type == 'spot' ? 'limit' : type,
            offset: offset,
            limit: tableData.limit,
            status: tableData.status,
        };
        socket.emit('listOrders', filter, (result) => {
            console.log(result);
            tableData.list = result.list;
            tableData.total = result.total;
            tableData.page = Math.floor(result.offset / result.limit) + 1;
            p.$scope.$applyAsync();
        });
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
        return text.substr(0, 6) + '...' + text.substr(text.length - 4);
    }
}

angular.module('app', ['ui.bootstrap'])
    .controller('appCtrl', AppCtrl)
    .controller('orderBookCtrl', OrderBookCtrl);

angular.bootstrap(document, ['app']);
